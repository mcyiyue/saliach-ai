'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import {
  MessageSquare, Settings, Users, Database,
  Folder, Shield, Link as LinkIcon, BookOpen,
  LayoutDashboard
} from 'lucide-react';

interface Module {
  id: number;
  name: string;
  routePath: string;
  icon?: string;
  children: Module[];
}

const getModuleIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('chat')) return <MessageSquare className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('admin') || lowerName.includes('sistem')) return <Settings className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('user') || lowerName.includes('pengguna') || lowerName.includes('grup') || lowerName.includes('management')) return <Users className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('data') || lowerName.includes('ingest') || lowerName.includes('dokumen')) return <Database className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('link') || lowerName.includes('tautan') || lowerName.includes('eksternal')) return <LinkIcon className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('izin') || lowerName.includes('permission')) return <Shield className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('teologi') || lowerName.includes('belajar')) return <BookOpen className="w-5 h-5 mr-3 opacity-90" />;
  if (lowerName.includes('dashboard') || lowerName.includes('beranda')) return <LayoutDashboard className="w-5 h-5 mr-3 opacity-90" />;

  // Default icon for top-level module
  return <Folder className="w-5 h-5 mr-3 opacity-90" />;
};

export default function Sidebar() {
  const [menu, setMenu] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchMenu = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/menu/tree`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setMenu(data);

          // Set default open state to true for all menus that have children
          const initialOpen: Record<number, boolean> = {};
          data.forEach((item: Module) => {
            if (item.children && item.children.length > 0) {
              initialOpen[item.id] = true;
            }
          });
          setOpenMenus(initialOpen);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [router]);

  const toggleMenu = (id: number) => {
    setOpenMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return <div className="w-64 bg-sidebar/55 text-sidebar-foreground/50 p-4 h-screen animate-pulse border-r border-sidebar-border hidden md:block" />;
  }

  // Render tree helper
  const renderMenu = (items: Module[], isTopLevel: boolean = true) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openMenus[item.id] ?? false;

      return (
        <div key={item.id} className="mb-1">
          {item.routePath ? (
            <Link href={item.routePath} onClick={() => setIsMobileOpen(false)}>
              <div className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-between font-medium active:scale-95 ${pathname === item.routePath
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:translate-x-1'
                }`}>
                <div className="flex items-center">
                  {isTopLevel && getModuleIcon(item.name)}
                  <span>{item.name}</span>
                </div>
              </div>
            </Link>
          ) : (
            /* Modul Induk (tidak punya routePath) */
            <div
              onClick={() => hasChildren && toggleMenu(item.id)}
              className={`px-4 py-3 rounded-lg flex items-center justify-between text-sidebar-foreground/60 font-bold text-sm tracking-wide select-none transition-all duration-300 active:scale-95 ${hasChildren ? 'cursor-pointer hover:bg-sidebar-accent/50 hover:text-sidebar-foreground' : 'mt-4'
                }`}
            >
              <div className="flex items-center">
                {isTopLevel && getModuleIcon(item.name)}
                <span>{item.name}</span>
              </div>

              {hasChildren && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3.5 h-3.5 transition-transform duration-300 text-sidebar-foreground/45 ${isOpen ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          )}

          {/* Render submodul jika menu induk dalam status terbuka (uncollapsed) */}
          {hasChildren && isOpen && (
            <div className="pl-3 mt-1.5 border-l border-sidebar-border/50 ml-6 space-y-1 transition-all duration-300 animate-in slide-in-from-left-2 fade-in">
              {renderMenu(item.children, false)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-5 left-4 z-40 p-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-secondary transition-all shadow-md active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 md:relative z-50 w-64 bg-sidebar/95 md:bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground flex flex-col h-[100dvh] border-r border-white/5 dark:border-white/5 shrink-0 shadow-2xl md:shadow-xl transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-sidebar-border/50 pt-8 md:pt-6">
          <h1 className="text-xl font-bold text-primary hover:scale-105 transition-transform duration-300 origin-left cursor-default">
            Saliach-ai.xyz
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
          {menu.length === 0 ? (
            <p className="text-sidebar-foreground/50 text-sm italic px-4">Tidak ada akses menu.</p>
          ) : (
            renderMenu(menu, true)
          )}
        </div>

        <div className="p-4 border-t border-sidebar-border/50 bg-background/30 backdrop-blur-md">
          {/* Logout */}
          <Button
            variant="destructive"
            className="w-full justify-start bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 shadow-md hover:shadow-red-900/20 font-semibold h-10 transition-all duration-300 active:scale-95"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
