'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<void>) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('resumeai-user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('resumeai:auth-changed'));
      router.replace(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    });
  }

  async function onForgot() {
    await run(async () => {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    });
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Login</h2>
      <form className="space-y-3" onSubmit={onLogin}>
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? 'Please wait…' : 'Login'}</Button>
      </form>

      <button className="mt-4 text-sm text-brand" disabled={loading} onClick={onForgot}>Forgot password?</button>

      <p className="mt-3 text-sm text-green-700">{message}</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
      <p className="mt-3 text-sm">New here? <Link className="text-brand" href="/auth/register">Create account</Link></p>
    </Card>
  );
}
