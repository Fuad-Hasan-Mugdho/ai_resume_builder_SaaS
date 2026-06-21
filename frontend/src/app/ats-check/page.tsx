'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Textarea } from '@/components/ui';

export default function AtsCheckPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await api.post('/ai/ats-check', { resumeText, jobDescription }, { headers: { Authorization: `Bearer ${token}` } });
    setResult(res.data.scoreReport);
  }

  return (
    <Card>
      <h2 className="mb-4 text-2xl font-bold">ATS Check</h2>
      <form className="space-y-3" onSubmit={submit}>
        <Textarea rows={8} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste resume text" />
        <Textarea rows={8} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste job description" />
        <Button type="submit">Analyze</Button>
      </form>
      <pre className="mt-4 whitespace-pre-wrap text-sm">{result}</pre>
    </Card>
  );
}
