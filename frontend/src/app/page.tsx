'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';

const copy = {
  en: {
    title: 'Build ATS-Optimized Resume in Minutes',
    subtitle: 'Create, save, preview, and download a professional CV with a simple step-by-step builder.',
  },
  bn: {
    title: 'কয়েক মিনিটে ATS-Optimized Resume তৈরি করুন',
    subtitle: 'সহজ ধাপে পেশাদার CV তৈরি, সংরক্ষণ, প্রিভিউ ও ডাউনলোড করুন।',
  },
};

const features = [
  'Easy Step-by-Step Builder',
  'Live CV Preview',
  'Saved CVs',
  'Simple ৳20 CV Pass',
  'English + Bangla Support',
  'PDF Export Ready',
];

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => setLoggedIn(Boolean(localStorage.getItem('token')));
    syncAuth();
    window.addEventListener('resumeai:auth-changed', syncAuth);
    return () => window.removeEventListener('resumeai:auth-changed', syncAuth);
  }, []);

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-white p-10 shadow-lg">
        <div className="mb-4 flex gap-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={() => setLang('en')}>English</button>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => setLang('bn')}>বাংলা</button>
        </div>
        <h1 className="text-4xl font-bold">{copy[lang].title}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{copy[lang].subtitle}</p>
        <div className="mt-6 flex gap-3">
          <Link className="rounded-xl bg-brand px-4 py-2 font-semibold text-white" href={loggedIn ? '/resume-builder' : '/auth/register'}>{loggedIn ? 'Create Your CV' : 'Create Account'}</Link>
          <Link className="rounded-xl border px-4 py-2" href={loggedIn ? '/dashboard' : '/pricing'}>{loggedIn ? 'My Dashboard' : 'View ৳20 CV Pass'}</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature}><p className="font-semibold">{feature}</p></Card>
        ))}
      </section>
    </div>
  );
}
