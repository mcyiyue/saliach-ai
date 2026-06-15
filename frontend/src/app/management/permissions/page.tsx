'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Group {
  id: number;
  name: string;
  description: string | null;
}

interface Module {
  id: number;
  name: string;
  routePath: string | null;
  icon: string | null;
  parentId: number | null;
}

interface GroupPermission {
  groupId: number;
  moduleId: number;
  canRead: boolean;
  canWrite: boolean;
}

export default function PermissionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [permissionsMap, setPermissionsMap] = useState<Record<number, { canRead: boolean; canWrite: boolean }>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  // Fetch groups and modules on load
  useEffect(() => {
    const fetchInitData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        // Fetch groups
        const groupsRes = await fetch('http://localhost:4000/api/groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (groupsRes.ok) {
          const groupsData: Group[] = await groupsRes.json();
          setGroups(groupsData);
          if (groupsData.length > 0) {
            setSelectedGroupId(groupsData[0].id);
          }
        }

        // Fetch modules
        const modulesRes = await fetch('http://localhost:4000/api/permissions/modules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setModules(modulesData);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitData();
  }, []);

  // Fetch permissions when selectedGroupId changes
  useEffect(() => {
    if (selectedGroupId === null) return;

    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:4000/api/permissions/${selectedGroupId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const perms: GroupPermission[] = await res.json();
          
          // Map to record: moduleId -> { canRead, canWrite }
          const map: Record<number, { canRead: boolean; canWrite: boolean }> = {};
          
          // Initialize map with false for all modules
          modules.forEach(m => {
            map[m.id] = { canRead: false, canWrite: false };
          });

          // Override with database values
          perms.forEach(p => {
            map[p.moduleId] = { canRead: p.canRead, canWrite: p.canWrite };
          });

          setPermissionsMap(map);
        }
      } catch (error) {
        console.error('Failed to load group permissions:', error);
      }
    };

    fetchPermissions();
  }, [selectedGroupId, modules]);

  const handleCheckboxChange = (moduleId: number, field: 'canRead' | 'canWrite') => {
    // Safety check: prevent changing Administrator group (ID: 1) permissions to keep it full access
    if (selectedGroupId === 1) return;

    setPermissionsMap(prev => {
      const updatedVal = {
        ...prev[moduleId],
        [field]: !prev[moduleId][field]
      };

      // If we turn off canRead, canWrite should also be turned off (as write requires read in typical UX)
      if (field === 'canRead' && !updatedVal.canRead) {
        updatedVal.canWrite = false;
      }
      
      // If we turn on canWrite, canRead should also be turned on
      if (field === 'canWrite' && updatedVal.canWrite) {
        updatedVal.canRead = true;
      }

      return {
        ...prev,
        [moduleId]: updatedVal
      };
    });
  };

  const handleSave = async () => {
    if (selectedGroupId === null) return;

    // Extra safety: block sending updates for admin role in the client
    if (selectedGroupId === 1) {
      setStatus({ type: 'error', message: 'Izin untuk grup Administrator dikunci secara permanen pada akses penuh.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setStatus({ type: 'idle', message: '' });

    // Format payload: array of { moduleId, canRead, canWrite }
    const permissionsPayload = Object.entries(permissionsMap).map(([modId, perms]) => ({
      moduleId: Number(modId),
      canRead: perms.canRead,
      canWrite: perms.canWrite
    }));

    try {
      const res = await fetch(`http://localhost:4000/api/permissions/${selectedGroupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: permissionsPayload })
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Hak akses berhasil disimpan.' });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.message || 'Gagal menyimpan hak akses.' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatus({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setSaving(false);
    }
  };

  // Sort modules: Parents first, then children nested immediately underneath
  const buildSortedModules = (): Module[] => {
    const parents = modules.filter(m => m.parentId === null);
    const sorted: Module[] = [];
    
    parents.forEach(p => {
      sorted.push(p);
      const children = modules.filter(m => m.parentId === p.id);
      children.forEach(c => sorted.push(c));
    });

    return sorted;
  };

  const sortedModules = buildSortedModules();
  const activeGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col relative text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Hak Akses</h1>
        <p className="text-muted-foreground mt-1">Konfigurasikan matriks hak akses baca/tulis untuk setiap kelompok pengguna</p>
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

      {/* Group Selector Dropdown */}
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 mb-6 flex items-center gap-4 transition-colors">
        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Pilih Group / Peran:</label>
        <select
          value={selectedGroupId || ''}
          onChange={(e) => {
            setSelectedGroupId(Number(e.target.value));
            setStatus({ type: 'idle', message: '' });
          }}
          className="bg-background border border-border text-foreground rounded-lg h-11 px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none min-w-[200px]"
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {selectedGroupId === 1 && (
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0-6v2m0-6h.01M4.93 19h14.14a1 1 0 00.82-1.57l-7.07-12a1 1 0 00-1.64 0l-7.07 12A1 1 0 004.93 19z" /></svg>
            Izin grup Administrator dikunci penuh demi keamanan sistem.
          </span>
        )}
      </div>

      {/* Matrix Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex-1 flex flex-col overflow-hidden transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Matriks Hak Akses Modul</h2>
          {selectedGroupId !== 1 && (
            <Button
              onClick={handleSave}
              disabled={saving || loading || selectedGroupId === null}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-full shadow-md shadow-primary/10 transition-transform active:scale-95 flex items-center gap-2"
            >
              {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Memuat matriks izin...</p>
            </div>
          ) : sortedModules.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground italic">
              Tidak ada modul yang ditemukan di sistem.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/80 text-muted-foreground text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-4 pl-6">Nama Modul</th>
                  <th className="p-4 text-center w-40">Izin Baca (canRead)</th>
                  <th className="p-4 text-center w-40">Izin Tulis (canWrite)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {sortedModules.map((mod) => {
                  const isChild = mod.parentId !== null;
                  const perms = permissionsMap[mod.id] || { canRead: false, canWrite: false };
                  const isLocked = selectedGroupId === 1;

                  return (
                    <tr 
                      key={mod.id} 
                      className={`hover:bg-sidebar-accent/20 transition-colors ${!isChild ? 'bg-sidebar-accent/10' : ''}`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2">
                          {isChild && <span className="w-6 border-b border-border mr-1" />}
                          <span className={`${!isChild ? 'font-bold text-foreground text-s' : 'font-medium text-muted-foreground text-sm'}`}>
                            {mod.name}
                          </span>
                          {!isChild && (
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest bg-background border border-border px-1.5 py-0.5 rounded-md">
                              Menu Induk
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isLocked ? true : perms.canRead}
                          disabled={isLocked}
                          onChange={() => handleCheckboxChange(mod.id, 'canRead')}
                          className="rounded border-border text-primary focus:ring-primary w-5 h-5 cursor-pointer disabled:cursor-not-allowed bg-background"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isLocked ? true : perms.canWrite}
                          disabled={isLocked}
                          onChange={() => handleCheckboxChange(mod.id, 'canWrite')}
                          className="rounded border-border text-primary focus:ring-primary w-5 h-5 cursor-pointer disabled:cursor-not-allowed bg-background"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
