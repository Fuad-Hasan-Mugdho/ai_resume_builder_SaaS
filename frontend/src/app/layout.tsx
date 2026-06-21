import './globals.css';
import type { Metadata } from 'next';
import { ApiErrorToast } from '@/components/api-error-toast';
import { AppNav } from '@/components/app-nav';

export const metadata: Metadata = {
  title: 'ResumeAI Pro',
  description: 'A simple ATS-friendly CV builder with live preview and PDF export',
  openGraph: { title: 'ResumeAI Pro', description: 'Create and download a professional ATS-ready CV' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApiErrorToast />
        <AppNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
