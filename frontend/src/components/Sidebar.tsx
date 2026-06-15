'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';

interface Module {
  id: number;
  name: string;
  routePath: string;
  icon?: string;
  children: Module[];
}

export default function Sidebar() {
  const [menu, setMenu] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
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
        const res = await fetch('http://localhost:4000/api/menu/tree', {
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
    return <div className="w-64 bg-sidebar/55 text-sidebar-foreground/50 p-4 h-screen animate-pulse border-r border-sidebar-border" />;
  }

  // Render tree helper
  const renderMenu = (items: Module[]) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openMenus[item.id] ?? false;

      return (
        <div key={item.id} className="mb-1">
          {item.routePath ? (
            <Link href={item.routePath}>
              <div className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between font-medium ${pathname === item.routePath
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}>
                <span>{item.name}</span>
              </div>
            </Link>
          ) : (
            /* Modul Induk (tidak punya routePath) */
            <div
              onClick={() => hasChildren && toggleMenu(item.id)}
              className={`px-4 py-2 rounded-lg flex items-center justify-between text-sidebar-foreground/55 font-semibold text-s tracking-wider select-none transition-colors ${hasChildren ? 'cursor-pointer hover:bg-sidebar-accent/50 hover:text-sidebar-foreground' : 'mt-4'
                }`}
            >
              <span>{item.name}</span>

              {hasChildren && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-sidebar-foreground/45 ${isOpen ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
          )}

          {/* Render submodul jika menu induk dalam status terbuka (uncollapsed) */}
          {hasChildren && isOpen && (
            <div className="pl-3 mt-1 border-l border-sidebar-border ml-4 space-y-1 transition-all duration-200">
              {renderMenu(item.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border shrink-0 shadow-lg transition-colors duration-300">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Saliach AI
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {menu.length === 0 ? (
          <p className="text-sidebar-foreground/50 text-sm italic px-4">Tidak ada akses menu.</p>
        ) : (
          renderMenu(menu)
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full justify-start bg-red-950/20 text-red-500 hover:bg-red-900/30 border border-red-900/30 font-semibold h-10 transition-colors"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
