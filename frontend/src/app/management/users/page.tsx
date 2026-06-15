'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Group {
  id: number;
  name: string;
  description: string | null;
}

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  groups: Group[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Extract current user ID from JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.id) {
          setCurrentUserId(Number(payload.id));
        }
      } catch (e) {
        console.error('Failed to parse JWT payload:', e);
      }
    }
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      // Fetch users
      const usersRes = await fetch('http://localhost:4000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch groups
      const groupsRes = await fetch('http://localhost:4000/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setName('');
    setEmail('');
    setPassword('');
    setSelectedGroupIds([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // leave password empty in edit mode
    setSelectedGroupIds(user.groups.map(g => g.id));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (groupId: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (modalMode === 'create' && !password) {
      setFormError('Password is required for new users.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setFormLoading(true);
    setFormError('');
    setStatus({ type: 'idle', message: '' });

    const apiUrl = modalMode === 'create'
      ? 'http://localhost:4000/api/users'
      : `http://localhost:4000/api/users/${selectedId}`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    // Prepare body payload
    const payload: any = {
      name,
      email,
      groupIds: selectedGroupIds
    };
    if (password) {
      payload.password = password;
    }

    try {
      const res = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: 'success',
          message: modalMode === 'create' ? 'Pengguna berhasil ditambahkan.' : 'Data pengguna berhasil diperbarui.'
        });
        setIsModalOpen(false);
        fetchData();
      } else {
        setFormError(data.message || 'Gagal menyimpan pengguna.');
      }
    } catch (error) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Pengguna berhasil dihapus.' });
        setIsDeleteOpen(false);
        setUserToDelete(null);
        fetchData();
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Gagal menghapus pengguna.' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col relative text-foreground">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground mt-1">Daftarkan dan kelola pengguna aplikasi serta peran kelompoknya</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-full shadow-md shadow-primary/10 transition-transform active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Tambah User
        </Button>
      </div>

      {/* Status Alert */}
      {status.message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all ${status.type === 'success'
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-950/20 border-red-900/40 text-red-600 dark:text-red-400'
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
            placeholder="Cari nama pengguna atau email..."
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
              <p className="text-sm text-muted-foreground">Memuat data pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center p-6">
              <svg className="w-12 h-12 text-muted-foreground/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="font-medium italic">Tidak ada pengguna yang ditemukan.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/80 text-muted-foreground text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-4 pl-6">Nama</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Grup / Peran</th>
                  <th className="p-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-sidebar-accent/30 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-foreground flex items-center gap-2">
                      {user.name}
                      {currentUserId === user.id && (
                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.groups.length === 0 ? (
                          <span className="text-xs text-muted-foreground/50 italic">Tidak ada grup</span>
                        ) : (
                          user.groups.map(g => (
                            <span 
                              key={g.id} 
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${g.id === 1 
                                ? 'bg-purple-950/20 text-purple-400 border-purple-900/30' 
                                : 'bg-primary/10 text-primary border-primary/20'
                              }`}
                            >
                              {g.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        className="border-border hover:bg-primary/10 hover:text-primary transition-colors text-xs px-3"
                      >
                        Edit
                      </Button>
                      {currentUserId !== user.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-colors text-xs px-3"
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
                {modalMode === 'create' ? 'Tambah User Baru' : 'Edit Detail User'}
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
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 text-xs bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap pengguna..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-border text-foreground h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email <span className="text-red-500">*</span></label>
                  <Input
                    type="email"
                    required
                    placeholder="Contoh: user@gereja.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border text-foreground h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Password {modalMode === 'create' ? <span className="text-red-500">*</span> : <span className="text-muted-foreground/60 font-normal italic">(Biarkan kosong jika tidak diganti)</span>}
                  </label>
                  <Input
                    type="password"
                    required={modalMode === 'create'}
                    placeholder={modalMode === 'create' ? "Masukkan password awal..." : "Masukkan password baru..."}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border text-foreground h-11 rounded-lg"
                  />
                </div>

                {/* Groups checkboxes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Grup / Hak Akses</label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-background/50 border border-border rounded-xl">
                    {groups.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground col-span-2">Belum ada group terdaftar.</p>
                    ) : (
                      groups.map(g => (
                        <label 
                          key={g.id} 
                          className="flex items-center gap-2.5 cursor-pointer text-sm text-foreground/80 hover:text-foreground select-none"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroupIds.includes(g.id)}
                            onChange={() => handleCheckboxChange(g.id)}
                            className="rounded border-border text-primary focus:ring-primary w-4.5 h-4.5 bg-background"
                          />
                          <span>{g.name}</span>
                        </label>
                      ))
                    )}
                  </div>
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
      {isDeleteOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4 text-red-500">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Hapus Akun Pengguna</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Konfirmasi penghapusan pengguna</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Apakah Anda yakin ingin menghapus akun pengguna <span className="font-bold text-foreground">"{userToDelete.name}" ({userToDelete.email})</span>? Tindakan ini akan mencabut seluruh hak akses pengguna ini dari sistem secara permanen.
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
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus Akun'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
