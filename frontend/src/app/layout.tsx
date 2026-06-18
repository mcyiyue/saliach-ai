'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex selection:bg-primary/30 transition-colors duration-300`}>
        {/* Floating Dark Mode Toggle in Top Right Corner */}
        <button 
          onClick={toggleTheme}
          className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-card border border-border text-foreground hover:bg-secondary transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer shadow-indigo-500/5 dark:shadow-none"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            /* Sun Icon (Mode Terang) */
            <svg className="w-5 h-5 text-yellow-500 animate-in fade-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
          ) : (
            /* Moon Icon (Mode Gelap) */
            <svg className="w-5 h-5 text-purple-600 animate-in fade-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        {!isLoginPage && <Sidebar />}
        <main className={`flex-1 overflow-y-auto bg-background/50 h-screen transition-colors duration-300 flex flex-col`}>
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {children}
          </div>
          {!isLoginPage && pathname !== '/chat' && (
            <div className="py-3 text-center text-[10px] md:text-xs font-medium tracking-wide text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-default shrink-0">
              Jo Immanuel Powered by Antigravity
            </div>
          )}
        </main>
      </body>
    </html>
  );
}
