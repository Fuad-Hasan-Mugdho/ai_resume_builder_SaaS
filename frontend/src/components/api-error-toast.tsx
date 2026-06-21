'use client';

import { useEffect, useState } from 'react';

export function ApiErrorToast() {
  const [error, setError] = useState<{ message: string; status?: number }>();

  useEffect(() => {
    let timer: number | undefined;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; status?: number }>).detail;
      setError(detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setError(undefined), 6000);
    };
    window.addEventListener('resumeai:api-error', handler);
    return () => {
      window.removeEventListener('resumeai:api-error', handler);
      window.clearTimeout(timer);
    };
  }, []);

  if (!error) return null;
  return (
    <div role="alert" aria-live="assertive" className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-bold">Request failed{error.status ? ` (${error.status})` : ''}</p><p className="mt-1 text-sm">{error.message}</p></div>
        <button aria-label="Dismiss error" onClick={() => setError(undefined)}>×</button>
      </div>
    </div>
  );
}
