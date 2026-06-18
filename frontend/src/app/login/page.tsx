'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden text-foreground transition-colors duration-300 px-4">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[900px] h-[300px] md:h-[900px] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse duration-10000" />

      <div className="w-full max-w-md p-6 md:p-10 relative z-10 bg-card/60 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] shadow-primary/5 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-8">
        <div className="text-center mb-8 md:mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
            SALIACH-AI
          </h1>
          <p className="text-muted-foreground text-sm mt-3 font-medium tracking-wide">Mari Belajar Monoteisme Yang Alkitabiah</p>
        </div>

        <div className="mb-6 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-center shadow-inner animate-in fade-in duration-500 delay-150">
          <p className="text-xs text-primary/80 font-semibold uppercase tracking-wider mb-1">Demo Account</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-sm font-bold text-primary">
            <span>user: guest@saliach-ai.xyz</span>
            <span className="hidden sm:inline opacity-30">|</span>
            <span>pass: 12345</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 md:space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider pl-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/40 backdrop-blur-sm border-white/10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:border-transparent h-12 md:h-14 rounded-2xl shadow-inner transition-all hover:bg-background/60"
              placeholder="Your Email"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider pl-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/40 backdrop-blur-sm border-white/10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:border-transparent h-12 md:h-14 rounded-2xl shadow-inner transition-all hover:bg-background/60"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="text-red-800 dark:text-red-200 text-sm p-4 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900/50 font-semibold animate-in shake shadow-sm">{error}</div>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 md:h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg transition-all shadow-xl shadow-primary/25 active:scale-95 group relative overflow-hidden mt-4"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating
              </span>
            ) : 'Sign In'}
          </Button>
        </form>
      </div>

      <div className="mt-8 relative z-10 text-xs font-medium tracking-wide text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors cursor-default">
        Jo Immanuel Powered by Antigravity
      </div>
    </div>
  );
}
