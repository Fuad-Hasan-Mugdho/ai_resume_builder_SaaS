'use client';

import { FormEvent, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('resumeai-user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('resumeai:auth-changed'));
      setMessage('Registration successful. You are now logged in.');
      router.push('/resume-builder');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Create account</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</Button>
      </form>
      <p className="mt-3 text-sm text-green-700">{message}</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
    </Card>
  );
}
