'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DocumentItem {
  title: string;
  uploadedBy: string;
  chunksCount: number;
  content: string;
}

export default function IngestPage() {
  // Tabs state: 'create' | 'manage'
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // Create state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // List state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all documents
  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setListLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/ingest`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `Berhasil! ${data.chunksProcessed} chunk tersimpan di Vector DB.` });
        setTitle('');
        setContent('');
        fetchDocuments(); // Refresh list
      } else {
        setStatus({ type: 'error', message: data.message || 'Gagal menyimpan dokumen.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/ingest/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `Berhasil! ${data.chunksProcessed} chunk dari file [${selectedFile.name}] tersimpan di Vector DB.` });
        setSelectedFile(null);
        fetchDocuments(); // Refresh list
      } else {
        setStatus({ type: 'error', message: data.message || 'Gagal mengunggah file.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEditClick = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditError('');
    setIsEditOpen(true);
  };

  // Submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !editTitle || !editContent) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/ingest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldTitle: selectedDoc.title,
          newTitle: editTitle,
          content: editContent
        })
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditOpen(false);
        fetchDocuments();
      } else {
        setEditError(data.message || 'Gagal memperbarui dokumen.');
      }
    } catch (error) {
      setEditError('Terjadi kesalahan jaringan.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (doc: DocumentItem) => {
    setDocToDelete(doc);
    setIsDeleteOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/ingest`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: docToDelete.title })
      });

      if (res.ok) {
        setIsDeleteOpen(false);
        setDocToDelete(null);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="p-4 pt-20 md:p-8 max-w-6xl mx-auto h-full flex flex-col relative text-foreground">
      <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Manajemen Database Vektor</h1>
          <p className="text-muted-foreground mt-1">Lakukan ingestion dokumen baru atau kelola data chunks doktrin Monoteisme Alkitabiah</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-card border border-border p-1 rounded-xl shrink-0 self-center md:self-start transition-colors duration-300">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Ingest Baru
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manage'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Kelola Dokumen ({documents.length})
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        /* ================= INGEST FORM ================= */
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex-1 overflow-y-auto transition-colors duration-300 flex flex-col">
          {/* Input Method Switcher */}
          <div className="flex bg-background/50 border border-border p-1 rounded-lg shrink-0 self-start mb-6 transition-colors duration-300">
            <button
              type="button"
              onClick={() => {
                setInputMethod('text');
                setStatus({ type: 'idle', message: '' });
              }}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${inputMethod === 'text'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Teks Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMethod('file');
                setStatus({ type: 'idle', message: '' });
              }}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${inputMethod === 'file'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Unggah File
            </button>
          </div>

          {inputMethod === 'text' ? (
            <form onSubmit={handleSubmit} className="space-y-6 w-full flex-1 flex flex-col">
              <div>
                <label className="text-sm font-semibold text-foreground/80 block mb-2">Judul Dokumen / Referensi</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 h-12"
                  placeholder="Cth: Doktrin Keesaan Allah Bab 1"
                  required
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-sm font-semibold text-foreground/80 block mb-2 flex-shrink-0">Isi Konten Teks</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-80 bg-background/50 border border-border rounded-xl text-foreground p-4 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-colors duration-300"
                  placeholder="Tempel teks panjang dokumen di sini. Teks akan secara otomatis dipotong berdasarkan paragraf di backend dan diproses ke Embedding API OpenAI..."
                  required
                />
              </div>

              {status.message && (
                <div className={`p-4 rounded-xl border font-medium shadow-sm transition-colors flex justify-between items-start gap-4 ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200'
                  }`}>
                  <div>{status.message}</div>
                  <button 
                    type="button" 
                    onClick={() => setStatus({ type: 'idle', message: '' })}
                    className="opacity-70 hover:opacity-100 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/10 transition-transform active:scale-95 self-start"
              >
                {loading ? 'Memproses ke Vector DB...' : 'Ingest ke Knowledge Base'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFileUploadSubmit} className="space-y-6 w-full">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-foreground/80 block mb-2 font-medium">Pilih File Dokumen</label>
                <div 
                  className={`w-full border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer bg-background/30 hover:bg-background/50 ${
                    selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input 
                    id="file-upload-input"
                    type="file" 
                    accept=".md,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  
                  <svg className={`w-12 h-12 mb-4 transition-colors ${selectedFile ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground mb-1">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      <p className="text-xs text-primary mt-3 font-semibold hover:underline">Klik untuk mengganti file</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground/90 mb-1">Tarik & lepas file di sini, atau klik untuk memilih</p>
                      <p className="text-xs text-muted-foreground/80">Eksklusif hanya mendukung file Markdown (.md) dan Text (.txt) hingga 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {status.message && (
                <div className={`p-4 rounded-xl border font-medium shadow-sm transition-colors flex justify-between items-start gap-4 ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200'
                  }`}>
                  <div>{status.message}</div>
                  <button 
                    type="button" 
                    onClick={() => setStatus({ type: 'idle', message: '' })}
                    className="opacity-70 hover:opacity-100 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !selectedFile}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/10 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 self-start"
              >
                {loading ? 'Mengunggah & Memproses File...' : 'Unggah & Ingest ke Vector DB'}
              </Button>
            </form>
          )}
        </div>
      ) : (
        /* ================= DOCUMENT MANAGE TABLE ================= */
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
          {/* Search bar */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Cari judul dokumen atau pengunggah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/30">
            {listLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                Tidak ada dokumen yang ditemukan.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background/80 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Judul Dokumen</th>
                    <th className="p-4">Diunggah Oleh</th>
                    <th className="p-4 text-center">Jumlah Chunks</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {filteredDocuments.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-background/20 transition-colors group">
                      <td className="p-4 font-medium text-foreground/90 group-hover:text-foreground max-w-sm truncate">
                        {doc.title}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {doc.uploadedBy}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {doc.chunksCount} chunks
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(doc)}
                          className="bg-secondary hover:bg-secondary/80 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold border border-border transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(doc)}
                          className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black border border-amber-500/80 transition-colors text-xs px-3 py-1.5 font-bold uppercase tracking-wider shadow-sm cursor-pointer rounded-lg"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT DIALOG / MODAL (CUSTOM UI) ================= */}
      {isEditOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl p-6 flex flex-col max-h-[90vh] scale-in">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-xl font-bold text-foreground">Edit Dokumen Vektor</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Judul Dokumen</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-background border-border text-foreground h-11"
                  required
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[15rem]">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Konten Dokumen</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 w-full bg-background border border-border rounded-xl text-foreground p-4 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-y-auto transition-colors duration-300"
                  required
                />
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200 p-3 rounded-xl text-sm font-semibold shadow-sm">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG / MODAL ================= */}
      {isDeleteOpen && docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">Hapus Dokumen Vektor?</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen <strong className="text-foreground">"{docToDelete.title}"</strong>? Semua potongan (chunks) dan vektor embedding terkait akan dihapus secara permanen dari ChromaDB.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black font-extrabold tracking-wider uppercase border-2 border-amber-500/80 px-6 shadow-md shadow-amber-500/20"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus Dokumen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
