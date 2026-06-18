'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Feedback {
  id: number;
  query: string;
  response: string;
  citations: string | null;
  rating: number;
  comment: string | null;
  isResolved: boolean;
  createdAt: string;
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/feedbacks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch');
      }

      const data = await res.json();
      setFeedbacks(data);
    } catch (error) {
      console.error(error);
      // alert('Gagal memuat data evaluasi AI atau Anda tidak memiliki akses.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/feedbacks/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, isResolved: true } : f));
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(prev => prev ? { ...prev, isResolved: true } : null);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus evaluasi ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/feedbacks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(null);
        }
      } else {
        alert('Gagal menghapus evaluasi');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Memuat data evaluasi...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col h-[100dvh]">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Evaluasi AI (RLHF)</h1>
          <p className="text-muted-foreground mt-2">Pantau dan perbaiki kelemahan jawaban AI dari umpan balik pengguna.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Table List */}
        <div className={`flex-1 flex flex-col bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden ${selectedFeedback ? 'hidden md:flex' : 'flex'}`}>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Pertanyaan (Query)</th>
                  <th className="px-6 py-4 font-semibold">Komentar User</th>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">Belum ada data evaluasi. AI Anda sempurna!</td>
                  </tr>
                ) : feedbacks.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer ${selectedFeedback?.id === item.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedFeedback(item)}
                  >
                    <td className="px-6 py-4">
                      {item.isResolved ? (
                        <span className="px-2.5 py-1 text-xs font-medium bg-green-500/20 text-green-600 rounded-full border border-green-500/20">Selesai</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/20">Menunggu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.rating === 1 ? (
                        <span className="text-green-500 font-bold">👍 Bagus</span>
                      ) : (
                        <span className="text-red-500 font-bold">👎 Buruk</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium max-w-[200px] truncate" title={item.query}>{item.query}</td>
                    <td className="px-6 py-4 max-w-[150px] truncate text-muted-foreground italic">{item.comment || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFeedback(item); }}>Detail</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedFeedback && (
          <div className="w-full md:w-[450px] shrink-0 flex flex-col bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-right-4 md:slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold text-foreground">Detail Evaluasi</h3>
              <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pertanyaan User</h4>
                <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium leading-relaxed">
                  {selectedFeedback.query}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Keluhan / Komentar</h4>
                {selectedFeedback.comment ? (
                  <div className="p-4 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl text-sm italic">
                    "{selectedFeedback.comment}"
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tidak ada komentar spesifik.</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Jawaban AI Saat Itu</h4>
                <div className="p-4 bg-muted/50 border border-border/50 rounded-xl text-sm text-foreground leading-relaxed h-48 overflow-y-auto scrollbar-thin">
                  {selectedFeedback.response}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Konteks Dokumen (Sitasi)</h4>
                <div className="text-xs font-mono bg-black/5 dark:bg-black/30 p-4 rounded-xl overflow-x-auto">
                  {selectedFeedback.citations ? (
                    <pre>{JSON.stringify(JSON.parse(selectedFeedback.citations), null, 2)}</pre>
                  ) : (
                    <span className="italic text-muted-foreground">Tidak ada sitasi dokumen.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/50 bg-muted/30 flex flex-col gap-3">
              <Button 
                className="w-full h-11 text-sm font-bold shadow-md transition-all active:scale-95" 
                variant={selectedFeedback.isResolved ? "outline" : "default"}
                onClick={() => handleResolve(selectedFeedback.id)}
                disabled={selectedFeedback.isResolved}
              >
                {selectedFeedback.isResolved ? '✅ Sudah Diperbaiki' : 'Tandai Selesai Diperbaiki'}
              </Button>
              <Button 
                className="w-full h-11 text-sm font-extrabold shadow-md transition-all active:scale-95 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-yellow-500/80 uppercase tracking-wider" 
                onClick={() => handleDelete(selectedFeedback.id)}
              >
                Hapus Evaluasi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
