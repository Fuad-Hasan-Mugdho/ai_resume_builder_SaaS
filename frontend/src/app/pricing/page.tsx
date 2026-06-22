'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';

type SavedResume = { id: string; title: string };
type Payment = {
  id: string;
  resumeId?: string;
  provider: string;
  transactionId: string;
  amount: number;
  status: string;
  rejectionNote?: string;
  exportUsedAt?: string;
  accessExpiresAt?: string;
  resume?: SavedResume;
};

export default function PricingPage() {
  const [provider, setProvider] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [savedResumeCount, setSavedResumeCount] = useState(0);
  const [resumeId, setResumeId] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectionNotice, setSelectionNotice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const merchantNumber = process.env.NEXT_PUBLIC_PAYMENT_NUMBER || '01551806306';

  async function loadPage() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [resumeResponse, paymentResponse] = await Promise.all([
        api.get('/resumes', { headers }),
        api.get('/payments/manual/status', { headers }),
      ]);
      const allResumes = resumeResponse.data as SavedResume[];
      const allPayments = paymentResponse.data as Payment[];
      const now = new Date();
      const eligibleResumes = allResumes.filter((resume) => {
        const latestPayment = allPayments.find((payment) => payment.resumeId === resume.id);
        if (!latestPayment) return true;
        if (latestPayment.status === 'PENDING') return false;
        const approvedAndActive = latestPayment.status === 'APPROVED' &&
          (!latestPayment.accessExpiresAt || new Date(latestPayment.accessExpiresAt) > now);
        return !approvedAndActive;
      });

      setSavedResumeCount(allResumes.length);
      setResumes(eligibleResumes);
      setPayments(allPayments);
      const requestedId = new URLSearchParams(window.location.search).get('resumeId');
      const requestedResume = allResumes.find((resume) => resume.id === requestedId);
      const requestedIsEligible = eligibleResumes.some((resume) => resume.id === requestedId);
      const requestedPayment = allPayments.find((payment) => payment.resumeId === requestedId);
      setSelectionNotice(requestedResume && !requestedIsEligible
        ? requestedPayment?.status === 'PENDING'
          ? `${requestedResume.title} already has a payment waiting for admin approval.`
          : `${requestedResume.title} already has active download access. No new payment is needed.`
        : '');
      setResumeId((current) => {
        if (eligibleResumes.some((resume) => resume.id === current)) return current;
        return (requestedIsEligible ? requestedId : eligibleResumes[0]?.id) || '';
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  useEffect(() => { loadPage(); }, []);

  async function submitPayment() {
    const token = localStorage.getItem('token');
    if (!token) return setError('Please login first');
    if (!resumeId || !senderNumber.trim() || !transactionId.trim()) return setError('Select a CV and enter the sender number and Transaction ID');
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/payments/manual', { resumeId, provider, senderNumber, transactionId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Payment submitted for this CV. Admin approval is pending.');
      setTransactionId('');
      await loadPage();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-bold">৳20 Per CV</h1>
        <p className="mt-2 text-sm">Select the CV you want to download, then send exactly ৳20 to <b>{merchantNumber}</b>.</p>

        {savedResumeCount === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed p-6 text-center"><p className="text-slate-600">Create and save a CV before submitting payment.</p><Link className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 font-semibold text-white" href="/resume-builder">Create Your CV</Link></div>
        ) : resumes.length === 0 ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center"><p className="font-semibold text-green-800">No payment is needed right now.</p><p className="mt-1 text-sm text-green-700">All saved CVs already have active download access or a payment waiting for approval.</p><Link className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 font-semibold text-white" href="/dashboard">Go to Dashboard</Link></div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">Payment for CV</span><select className="w-full rounded-xl border px-3 py-2" value={resumeId} onChange={(event) => setResumeId(event.target.value)}>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></label>
            <select className="rounded-xl border px-3 py-2" value={provider} onChange={(event) => setProvider(event.target.value as 'BKASH' | 'NAGAD')}><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option></select>
            <Input placeholder="Sender mobile number" value={senderNumber} onChange={(event) => setSenderNumber(event.target.value)} />
            <Input placeholder="Transaction ID" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} />
            <Button disabled={loading} onClick={submitPayment}>{loading ? 'Submitting...' : 'Submit Payment'}</Button>
          </div>
        )}

        {selectionNotice && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-800">{selectionNotice}</p>}
        {message && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
      </Card>

      {payments.length > 0 && <Card><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Your Payments</h2><Button onClick={loadPage}>Refresh</Button></div><div className="mt-3 space-y-2">{payments.map((payment) => { const expired = payment.status === 'APPROVED' && Boolean(payment.accessExpiresAt && new Date(payment.accessExpiresAt) <= new Date()); const statusLabel = expired ? 'EXPIRED' : payment.status === 'APPROVED' ? 'APPROVED - DOWNLOAD ACTIVE' : payment.status; return <div key={payment.id} className="rounded-xl border p-3 text-sm"><p className="font-semibold">CV: {payment.resume?.title || 'Legacy payment - CV not linked'}</p><p>{payment.provider} · ৳{payment.amount} · TrxID: {payment.transactionId}</p><p>Status: <b>{statusLabel}</b></p>{payment.accessExpiresAt && <p>Download access until: {new Date(payment.accessExpiresAt).toLocaleString()}</p>}{payment.rejectionNote && <p className="text-red-600">{payment.rejectionNote}</p>}</div>;})}</div></Card>}
    </div>
  );
}
