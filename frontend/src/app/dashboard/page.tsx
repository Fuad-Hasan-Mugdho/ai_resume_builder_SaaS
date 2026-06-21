'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui';
import { useRequireAuth } from '@/hooks/use-require-auth';

type SavedResume = {
  id: string;
  title: string;
  updatedAt: string;
  resumeDataJson?: { personal?: { fullName?: string; email?: string } };
};

type ResumePayment = {
  id: string;
  resumeId?: string;
  transactionId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  accessExpiresAt?: string;
  exportUsedAt?: string;
  createdAt: string;
};

export default function DashboardPage() {
  const authReady = useRequireAuth();
  const [data, setData] = useState<any>(null);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [payments, setPayments] = useState<ResumePayment[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get('/dashboard', { headers }),
      api.get('/resumes', { headers }),
      api.get('/payments/manual/status', { headers }),
    ]).then(([dashboardResponse, resumesResponse, paymentsResponse]) => {
      setData(dashboardResponse.data);
      setResumes(resumesResponse.data);
      setPayments(paymentsResponse.data);
    });
  }, []);

  if (!authReady || !data) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Welcome, {data.userName}</h1><p className="text-slate-600">Here is your CV account overview.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="#saved-resumes" aria-label="View saved resumes">
          <Card className="h-full cursor-pointer transition hover:border-brand hover:shadow-md"><h3 className="font-semibold">Total Resumes</h3><p className="text-3xl">{data.totalResumes}</p><p className="mt-2 text-sm font-medium text-brand">View saved CVs</p></Card>
        </Link>
        <Card><h3 className="font-semibold">Average ATS</h3><p className="text-3xl">{Math.round(data.atsScoreAverage)}</p></Card>
        <Card><h3 className="font-semibold">Plan</h3><p className="text-3xl">{data.subscriptionStatus}</p></Card>
      </div>

      <Card id="saved-resumes" className="scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold">Saved CVs</h2><p className="text-sm text-slate-500">Open a CV to view or continue editing it.</p></div>
          <Link className="rounded-xl bg-brand px-4 py-2 font-semibold text-white" href="/resume-builder">Create New CV</Link>
        </div>
        <div className="mt-4 space-y-3">
          {resumes.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">You have not saved a CV yet.</p>}
          {resumes.map((resume) => {
            const payment = payments.find((item) => item.resumeId === resume.id);
            const expired = Boolean(payment?.accessExpiresAt && new Date(payment.accessExpiresAt) <= new Date());
            const paymentLabel = !payment ? 'NOT PAID' : payment.status === 'PENDING' ? 'PENDING APPROVAL' : payment.status === 'REJECTED' ? 'REJECTED' : expired ? 'PAYMENT EXPIRED' : 'PAID - DOWNLOAD ACTIVE';
            const paidReady = paymentLabel === 'PAID - DOWNLOAD ACTIVE';
            return (
            <div key={resume.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="space-y-1">
                <h3 className="font-semibold">{resume.title}</h3>
                {resume.resumeDataJson?.personal?.fullName && <p className="text-sm text-slate-600">{resume.resumeDataJson.personal.fullName}</p>}
                <p className="text-xs text-slate-500">Last updated: {new Date(resume.updatedAt).toLocaleString()}</p>
                <p className="text-sm">Payment: <b className={paidReady ? 'text-green-700' : payment?.status === 'PENDING' ? 'text-amber-700' : 'text-red-700'}>{paymentLabel}</b></p>
                {payment && <p className="text-xs text-slate-500">Transaction ID: {payment.transactionId}</p>}
                {paidReady && payment?.accessExpiresAt && <p className="text-xs text-green-700">Download access until: {new Date(payment.accessExpiresAt).toLocaleString()}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-xl border px-4 py-2 font-semibold" href={`/resume-builder?resumeId=${encodeURIComponent(resume.id)}`}>Open / Edit</Link>
                {!paidReady && payment?.status !== 'PENDING' && <Link className="rounded-xl bg-brand px-4 py-2 font-semibold text-white" href={`/pricing?resumeId=${encodeURIComponent(resume.id)}`}>Pay ৳20</Link>}
                {payment?.status === 'PENDING' && <Link className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white" href={`/pricing?resumeId=${encodeURIComponent(resume.id)}`}>View Payment</Link>}
              </div>
            </div>
          );})}
        </div>
      </Card>
    </div>
  );
}
