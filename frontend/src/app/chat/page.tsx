'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, citations?: any[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('saliach_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('saliach_chat_history', JSON.stringify(messages));
    }
  }, [messages, mounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: userQuery,
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      // Handle Server-Sent Events (SSE) via Fetch API
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      let buffer = '';
      
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Keep the last incomplete part in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;
          
          if (trimmedLine.startsWith('event: citations')) {
            const dataStr = trimmedLine.replace(/^event: citations\r?\ndata:\s*/, '');
            try {
              const citations = JSON.parse(dataStr.trim());
              setMessages(prev => {
                if (prev.length === 0) return prev;
                return prev.map((msg, idx) => {
                  if (idx === prev.length - 1) {
                    return { ...msg, citations };
                  }
                  return msg;
                });
              });
            } catch (e) {
              console.error('Failed to parse citations:', e);
            }
          } 
          else if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.replace(/^data:\s*/, '');
            if (dataStr === '{}') continue; // Skip event: done data: {}
            try {
              const data = JSON.parse(dataStr.trim());
              if (data.text) {
                setMessages(prev => {
                  if (prev.length === 0) return prev;
                  return prev.map((msg, idx) => {
                    if (idx === prev.length - 1) {
                      return { ...msg, content: msg.content + data.text };
                    }
                    return msg;
                  });
                });
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Maaf, terjadi kesalahan pada server.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-background transition-colors duration-300">
        <div className="p-6 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-colors duration-300">
          <h2 className="text-2xl font-bold text-foreground">Monoteisme Alkitabiah Bot</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground/80">
          Memuat riwayat chat...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-colors duration-300 flex flex-col gap-2.5 items-start">
        <h2 className="text-2xl font-bold text-foreground">Monoteisme Alkitabiah Bot</h2>
        {messages.length > 0 && (
          <Button 
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus semua riwayat chat?')) {
                setMessages([]);
                localStorage.removeItem('saliach_chat_history');
              }
            }} 
            variant="outline"
            className="text-xs border-red-500/30 hover:bg-red-500/10 text-red-500 font-semibold rounded-xl px-3 py-1.5 h-auto transition-all duration-200"
          >
            Hapus Riwayat
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/85">
            <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-4 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <p className="font-medium">Mulai percakapan dengan AI Doktrin</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl rounded-2xl p-5 shadow-sm transition-all duration-200 border ${msg.role === 'user'
                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10'
                : 'bg-card border-border text-foreground'
                }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}


              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-card border-t border-border transition-colors duration-300">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Ketik pertanyaan Anda di sini..."
            className="w-full h-14 pl-6 pr-32 rounded-full bg-background border-border text-foreground focus-visible:ring-primary shadow-inner"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 h-10 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-semibold"
          >
            {loading ? 'Berpikir...' : 'Kirim'}
          </Button>
        </form>
      </div>
    </div>
  );
}
