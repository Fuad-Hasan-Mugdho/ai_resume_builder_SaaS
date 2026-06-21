'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button, Card } from '@/components/ui';

type ManualPayment = {
  id: string;
  provider: string;
  senderNumber: string;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectionNote?: string;
  user: { name: string; email: string };
  resume?: { id: string; title: string };
};

export default function AdminPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('resumeai-user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!token) {
      router.replace('/auth/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/manual-payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function reviewPayment(id: string, status: 'APPROVED' | 'REJECTED') {
    const token = localStorage.getItem('token');
    if (!token) return router.replace('/auth/login');

    const rejectionNote = status === 'REJECTED'
      ? window.prompt('Why was this payment rejected?')?.trim() || 'Payment could not be verified'
      : undefined;

    setReviewingId(id);
    setMessage('');
    setError('');
    try {
      await api.patch(
        `/admin/manual-payments/${id}`,
        { status, rejectionNote },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(status === 'APPROVED' ? 'Payment approved. The CV Pass is now active.' : 'Payment rejected.');
      await loadPayments();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setReviewingId('');
    }
  }

  const pendingCount = payments.filter((payment) => payment.status === 'PENDING').length;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Payment Approvals</h1>
        <p className="mt-1 text-sm text-slate-600">Verify each bKash or Nagad transaction before approving the CV Pass.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">৳20 CV Pass Payments</h2>
            <p className="text-sm text-slate-500">{pendingCount} payment{pendingCount === 1 ? '' : 's'} waiting for review</p>
          </div>
          <Button onClick={loadPayments} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
        </div>

        {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-4 space-y-3">
          {!loading && payments.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">No payment requests yet.</p>
          )}
          {payments.map((payment) => (
            <div key={payment.id} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-1">
                <p className="font-semibold">{payment.user.name}</p>
                <p className="text-sm text-slate-500">{payment.user.email}</p>
                <p className="text-sm">CV: <b>{payment.resume?.title || 'Legacy payment - CV not linked'}</b></p>
                <p className="text-sm"><b>{payment.provider}</b> · Sender: {payment.senderNumber}</p>
                <p className="text-sm">Transaction ID: <b>{payment.transactionId}</b> · Amount: <b>৳{payment.amount}</b></p>
                <p className="text-xs text-slate-500">Submitted: {new Date(payment.createdAt).toLocaleString()}</p>
                <p className="text-sm">Status: <b className={payment.status === 'APPROVED' ? 'text-green-700' : payment.status === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}>{payment.status}</b></p>
                {payment.rejectionNote && <p className="text-sm text-red-700">Reason: {payment.rejectionNote}</p>}
              </div>
              {payment.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button disabled={reviewingId === payment.id} onClick={() => reviewPayment(payment.id, 'APPROVED')}>Approve</Button>
                  <Button disabled={reviewingId === payment.id} className="bg-red-600" onClick={() => reviewPayment(payment.id, 'REJECTED')}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
