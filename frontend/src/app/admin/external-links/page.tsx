'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExternalLink {
  id: number;
  title: string;
  url: string;
  description: string | null;
  createdAt: string;
}

export default function ExternalLinksPage() {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  // Add / Edit form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ExternalLink | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all external links
  const fetchLinks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/external-links`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch external links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (link: ExternalLink) => {
    setModalMode('edit');
    setSelectedId(link.id);
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setFormLoading(true);
    setFormError('');
    setStatus({ type: 'idle', message: '' });

    const apiUrl = modalMode === 'create'
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/external-links`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/external-links/${selectedId}`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, url, description })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: modalMode === 'create' ? 'Tautan eksternal berhasil ditambahkan.' : 'Tautan eksternal berhasil diperbarui.'
        });
        setIsModalOpen(false);
        fetchLinks();
      } else {
        setFormError(data.message || 'Gagal menyimpan tautan.');
      }
    } catch (error) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (link: ExternalLink) => {
    setLinkToDelete(link);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/external-links/${linkToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Tautan eksternal berhasil dihapus.' });
        setIsDeleteOpen(false);
        setLinkToDelete(null);
        fetchLinks();
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Gagal menghapus tautan.' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter links based on search
  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 pt-20 md:p-8 max-w-6xl mx-auto h-full flex flex-col relative text-foreground">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sumber Kajian Eksternal</h1>
          <p className="text-muted-foreground mt-1">Kelola tautan website luar yang diizinkan untuk dirujuk oleh Saliach AI</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-full shadow-md shadow-primary/10 transition-transform active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Tambah Tautan
        </Button>
      </div>

      {/* Global Status Message */}
      {status.message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all ${status.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200'
          }`}>
          <span>{status.message}</span>
          <button onClick={() => setStatus({ type: 'idle', message: '' })} className="hover:opacity-75">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
        {/* Search bar */}
        <div className="mb-6 relative">
          <Input
            type="text"
            placeholder="Cari nama website, tautan URL, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 h-12 pl-12 rounded-xl focus-visible:ring-primary shadow-inner"
          />
          <div className="absolute left-4 top-3.5 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Memuat data tautan...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center p-6">
              <svg className="w-12 h-12 text-muted-foreground/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <p className="font-medium italic">Tidak ada tautan eksternal yang ditemukan.</p>
              <p className="text-xs mt-1">Gunakan tombol "Tambah Tautan" untuk menambahkan sumber rujukan baru.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/80 text-muted-foreground text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-4 pl-6">Nama Website</th>
                  <th className="p-4">Alamat URL</th>
                  <th className="p-4">Deskripsi Rujukan</th>
                  <th className="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-sidebar-accent/30 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-foreground">{link.title}</td>
                    <td className="p-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium break-all flex items-center gap-1.5"
                      >
                        {link.url}
                        <svg className="w-3.5 h-3.5 inline-block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-sm truncate" title={link.description || ''}>
                      {link.description || <span className="italic opacity-60">Tidak ada deskripsi</span>}
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(link)}
                        className="border-border hover:bg-primary/10 hover:text-primary transition-colors text-xs px-3"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteModal(link)}
                        className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black border border-amber-500/80 transition-colors text-xs px-3 font-bold uppercase tracking-wider shadow-sm"
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= ADD/EDIT MODAL OVERLAY ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-background/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">
                {modalMode === 'create' ? 'Tambah Tautan Eksternal' : 'Edit Tautan Eksternal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200 text-sm rounded-xl font-semibold shadow-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">Nama Website</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background/40 border-border text-foreground h-11 focus-visible:ring-primary"
                    placeholder="Cth: Restitutio Theology"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">Alamat URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    type="url"
                    className="bg-background/40 border-border text-foreground h-11 focus-visible:ring-primary"
                    placeholder="Cth: https://restitutio.org/"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">Deskripsi Rujukan</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 bg-background/40 border border-border rounded-xl text-foreground p-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-colors"
                    placeholder="Jelaskan mengenai konten/doktrin yang disediakan oleh website ini..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border hover:bg-sidebar-accent/50 text-foreground font-semibold px-5 h-11 rounded-full"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 h-11 rounded-full shadow-md shadow-primary/10"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Tautan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteOpen && linkToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Hapus Tautan Eksternal?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus tautan <span className="font-semibold text-foreground">"{linkToDelete.title}"</span>? AI tidak akan bisa merujuk ke situs ini lagi jika dokumen lokal tidak mencukupi.
              </p>
            </div>
            <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="border-border hover:bg-sidebar-accent/50 text-foreground font-semibold px-5 h-11 rounded-full"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black font-extrabold tracking-wider uppercase border-2 border-amber-500/80 px-6 h-11 rounded-full shadow-md shadow-amber-500/20"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
