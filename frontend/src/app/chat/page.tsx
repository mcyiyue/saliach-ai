'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CopyButton = ({ content, isUser }: { content: string, isUser: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground/80 hover:text-primary-foreground' 
          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
      }`}
      title="Salin teks"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      )}
    </button>
  );
};

const FeedbackButtons = ({ message, previousUserMessage }: { message: any, previousUserMessage?: string }) => {
  const [rated, setRated] = useState<'up' | 'down' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (ratingVal: number, commentText?: string) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: previousUserMessage || 'Pertanyaan tidak diketahui',
          response: message.content,
          citations: message.citations || null,
          rating: ratingVal,
          comment: commentText
        })
      });
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    } finally {
      setSubmitting(false);
      setShowComment(false);
    }
  };

  const handleRate = async (rating: 1 | -1) => {
    if (rated) return;
    setRated(rating === 1 ? 'up' : 'down');
    if (rating === -1) {
      setShowComment(true);
    } else {
      await submitFeedback(1);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full max-w-sm">
      <div className="flex items-center gap-2">
        <CopyButton content={message.content} isUser={false} />
        
        <div className="h-4 w-px bg-border/50 mx-1"></div>
        
        <button 
          onClick={() => handleRate(1)}
          disabled={!!rated}
          className={`p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center shadow-sm border border-border/50 ${
            rated === 'up' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Jawaban Bagus"
        >
          <svg className="w-4 h-4" fill={rated === 'up' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
        </button>
        
        <button 
          onClick={() => handleRate(-1)}
          disabled={!!rated && rated !== 'down'}
          className={`p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center shadow-sm border border-border/50 ${
            rated === 'down' ? 'bg-red-500/20 text-red-600 border-red-500/30' : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title="Jawaban Buruk"
        >
          <svg className="w-4 h-4" fill={rated === 'down' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
        </button>
        
        {rated && !showComment && (
          <span className="text-xs text-muted-foreground ml-2 animate-in fade-in">Terima kasih atas masukannya!</span>
        )}
      </div>

      {showComment && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 p-3 bg-muted/30 rounded-xl border border-border/50 mt-1">
          <p className="text-xs text-muted-foreground font-medium">Bantu kami memperbaiki jawaban ini (opsional):</p>
          <textarea
            className="w-full text-sm p-2 rounded-md bg-background border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[60px] resize-none"
            placeholder="Konteks salah, ayat tidak tepat, dll..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
          />
          <div className="flex justify-end gap-2 mt-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={() => setShowComment(false)}>Batal</Button>
            <Button size="sm" className="h-7 text-xs px-3 bg-primary" disabled={submitting} onClick={() => submitFeedback(-1, comment)}>Kirim</Button>
          </div>
        </div>
      )}
    </div>
  );
};

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    <div className="flex flex-col h-[100dvh] md:h-full bg-background transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Gradient Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-64 md:w-96 h-64 md:h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="p-4 pt-20 md:p-6 md:pt-6 border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-20 shadow-sm transition-all duration-300 flex flex-col gap-2 md:gap-3 items-center md:items-start justify-center min-h-[5rem] text-center md:text-left">
        <h2 className="text-xl md:text-2xl font-bold text-primary hover:scale-[1.02] transition-transform origin-center md:origin-left cursor-default">
          Monoteisme Alkitabiah Bot
        </h2>
        {messages.length > 0 && (
          <Button 
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus semua riwayat chat?')) {
                setMessages([]);
                localStorage.removeItem('saliach_chat_history');
              }
            }} 
            className="text-[10px] md:text-xs bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black border-2 border-amber-500/80 font-extrabold tracking-wider uppercase rounded-full px-5 py-1.5 h-auto transition-all duration-300 active:scale-95 shadow-md shadow-amber-500/20"
          >
            Hapus Riwayat
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent z-10 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4 md:space-y-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/85 animate-in fade-in zoom-in-95 duration-500 px-4 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-card/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center mb-4 md:mb-6 transition-all shadow-xl shadow-primary/5 hover:scale-110 hover:border-primary/30 duration-300">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-primary drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <p className="font-medium text-base md:text-lg tracking-wide">Mulai percakapan dengan AI Doktrin</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`group relative max-w-[90%] md:max-w-[85%] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm transition-all duration-300 border flex flex-col gap-2 md:gap-3 ${msg.role === 'user'
                  ? 'bg-primary border-transparent text-primary-foreground shadow-lg shadow-primary/20 rounded-tr-sm hover:shadow-xl hover:shadow-primary/30'
                  : 'bg-card/70 backdrop-blur-lg border-white/10 dark:border-white/5 text-foreground rounded-tl-sm hover:bg-card/90 shadow-md'
                  }`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap leading-relaxed font-medium tracking-wide text-sm md:text-base">{msg.content}</div>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none text-foreground leading-relaxed prose-p:leading-relaxed prose-headings:text-primary">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  <div className={`flex flex-col md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'user' ? (
                      <CopyButton content={msg.content} isUser={true} />
                    ) : (
                      <FeedbackButtons 
                        message={msg} 
                        previousUserMessage={idx > 0 && messages[idx - 1].role === 'user' ? messages[idx - 1].content : undefined} 
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-6 bg-transparent z-10 pb-4 md:pb-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center shadow-2xl rounded-full animate-in slide-in-from-bottom-8 fade-in duration-500">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="Ketik pertanyaan Anda..."
            className="w-full h-12 md:h-16 pl-6 md:pl-8 pr-28 md:pr-36 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 text-foreground text-sm md:text-base focus-visible:ring-primary focus-visible:ring-2 shadow-inner transition-all hover:bg-card"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-1.5 md:right-2 h-9 md:h-12 px-4 md:px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all font-semibold shadow-md active:scale-95 disabled:opacity-50 text-xs md:text-base"
          >
            {loading ? (
              <span className="flex items-center gap-1.5 md:gap-2">
                <svg className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Memproses</span>
              </span>
            ) : 'Kirim'}
          </Button>
        </form>
      </div>
    </div>
  );
}
