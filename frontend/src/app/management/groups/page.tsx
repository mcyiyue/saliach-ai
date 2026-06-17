'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Group {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGroups = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setName('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setModalMode('edit');
    setSelectedId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setFormLoading(true);
    setFormError('');
    setStatus({ type: 'idle', message: '' });

    const apiUrl = modalMode === 'create'
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/groups`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/groups/${selectedId}`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: modalMode === 'create' ? 'Group berhasil ditambahkan.' : 'Group berhasil diperbarui.'
        });
        setIsModalOpen(false);
        fetchGroups();
      } else {
        setFormError(data.message || 'Gagal menyimpan group.');
      }
    } catch (error) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (group: Group) => {
    setGroupToDelete(group);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/groups/${groupToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Group berhasil dihapus.' });
        setIsDeleteOpen(false);
        setGroupToDelete(null);
        fetchGroups();
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Gagal menghapus group.' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 pt-20 md:p-8 max-w-6xl mx-auto h-full flex flex-col relative text-foreground">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Group / Role</h1>
          <p className="text-muted-foreground mt-1">Kelola kelompok pengguna dan hak perannya dalam sistem</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-full shadow-md shadow-primary/10 transition-transform active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Tambah Group
        </Button>
      </div>

      {/* Status Alert */}
      {status.message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all font-semibold shadow-sm ${status.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200'
        }`}>
          <span>{status.message}</span>
          <button onClick={() => setStatus({ type: 'idle', message: '' })} className="hover:opacity-75">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
        {/* Search */}
        <div className="mb-6 relative">
          <Input
            type="text"
            placeholder="Cari nama group atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 h-12 pl-12 rounded-xl focus-visible:ring-primary shadow-inner"
          />
          <div className="absolute left-4 top-3.5 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Memuat data group...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center p-6">
              <svg className="w-12 h-12 text-muted-foreground/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="font-medium italic">Tidak ada group yang ditemukan.</p>
              <p className="text-xs mt-1">Gunakan tombol "Tambah Group" untuk menambahkan kelompok baru.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/80 text-muted-foreground text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Nama Group</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-sidebar-accent/30 transition-colors">
                    <td className="p-4 pl-6 text-sm text-muted-foreground font-mono">#{group.id}</td>
                    <td className="p-4 font-semibold text-foreground">{group.name}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-md truncate" title={group.description || ''}>
                      {group.description || <span className="italic opacity-60">Tidak ada deskripsi</span>}
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(group)}
                        className="border-border hover:bg-primary/10 hover:text-primary transition-colors text-xs px-3"
                      >
                        Edit
                      </Button>
                      {group.id !== 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(group)}
                          className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black border border-amber-500/80 transition-colors text-xs px-3 font-bold uppercase tracking-wider shadow-sm"
                        >
                          Hapus
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= ADD/EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-background/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">
                {modalMode === 'create' ? 'Tambah Group Baru' : 'Edit Detail Group'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900/50 dark:text-red-200 text-sm rounded-xl font-semibold shadow-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Group <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Majelis, Jemaat, Moderator"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-border text-foreground h-11 rounded-lg"
                    disabled={modalMode === 'edit' && selectedId === 1} // Prevent renaming Administrator
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deskripsi Group</label>
                  <textarea
                    placeholder="Masukkan penjelasan singkat tentang peran group ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background/50 border border-border text-foreground text-sm rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="hover:bg-sidebar-accent"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteOpen && groupToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4 text-amber-500">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Hapus Group</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Konfirmasi penghapusan peran</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Apakah Anda yakin ingin menghapus group <span className="font-bold text-foreground">"{groupToDelete.name}"</span>? Anggota di dalam group ini akan kehilangan akses perannya, dan tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="p-6 border-t border-border bg-background/50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteOpen(false)}
                className="hover:bg-sidebar-accent"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="bg-amber-400 hover:bg-amber-500 text-black dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-black font-extrabold tracking-wider uppercase border-2 border-amber-500/80 px-6 shadow-md shadow-amber-500/20"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus Permanen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
