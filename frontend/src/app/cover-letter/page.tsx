'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Textarea } from '@/components/ui';

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [result, setResult] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await api.post('/ai/generate-cover-letter', { resumeText, jobDescription, tone }, { headers: { Authorization: `Bearer ${token}` } });
    setResult(res.data.coverLetter);
  }

  return (
    <Card>
      <h2 className="mb-4 text-2xl font-bold">Cover Letter Generator</h2>
      <form className="space-y-3" onSubmit={submit}>
        <select className="rounded-xl border px-3 py-2" value={tone} onChange={(e) => setTone(e.target.value)}>
          <option>Professional</option><option>Friendly</option><option>Formal</option><option>Creative</option>
        </select>
        <Textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Resume text" />
        <Textarea rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Job description" />
        <Button type="submit">Generate</Button>
      </form>
      <pre className="mt-4 whitespace-pre-wrap text-sm">{result}</pre>
    </Card>
  );
}
