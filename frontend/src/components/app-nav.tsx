'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function AppNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<{ name: string; role?: 'USER' | 'ADMIN' }>();

  useEffect(() => {
    const enabled = localStorage.getItem('resumeai-theme') === 'dark';
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
    const syncUser = () => {
      const stored = localStorage.getItem('resumeai-user');
      setUser(stored ? JSON.parse(stored) : undefined);
    };
    syncUser();
    const token = localStorage.getItem('token');
    if (token && !localStorage.getItem('resumeai-user')) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((response) => {
        localStorage.setItem('resumeai-user', JSON.stringify(response.data));
        setUser(response.data);
      }).catch(() => logout());
    }
    window.addEventListener('resumeai:auth-changed', syncUser);
    return () => window.removeEventListener('resumeai:auth-changed', syncUser);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('resumeai-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('resumeai-user');
    setUser(undefined);
    setOpen(false);
    router.push('/auth/login');
  }

  return <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
    <nav className="mx-auto max-w-6xl px-4 py-3">
      <div className="flex items-center justify-between">
        <Link href={user?.role === 'ADMIN' ? '/admin' : user ? '/dashboard' : '/'} className="text-xl font-bold text-brand">ResumeAI Pro</Link>
        <div className="flex gap-2"><button aria-label="Toggle theme" className="rounded-lg border px-3 py-1 text-sm" onClick={toggleTheme}>{dark ? '☀' : '☾'}</button><button aria-label="Toggle navigation" className="rounded-lg border px-3 py-1 lg:hidden" onClick={() => setOpen(!open)}>Menu</button></div>
      </div>
      <div className={`${open ? 'flex' : 'hidden'} mt-3 flex-col gap-3 text-sm lg:mt-0 lg:flex lg:flex-row lg:flex-wrap lg:justify-end`}>
        {user?.role === 'ADMIN' && <Link href="/admin" onClick={() => setOpen(false)}>Payment Approvals</Link>}
        {user && user.role !== 'ADMIN' && <Link href="/resume-builder" onClick={() => setOpen(false)}>Create CV</Link>}
        {user && user.role !== 'ADMIN' && <Link href="/dashboard" onClick={() => setOpen(false)}>My Dashboard</Link>}
        {user?.role !== 'ADMIN' && <Link href="/pricing" onClick={() => setOpen(false)}>৳20 CV Pass</Link>}
        {user ? <><span className="font-semibold">Welcome, {user.name}</span><button className="text-red-600" onClick={logout}>Logout</button></> : <Link href="/auth/login" onClick={() => setOpen(false)}>Login</Link>}
      </div>
    </nav>
  </header>;
}
