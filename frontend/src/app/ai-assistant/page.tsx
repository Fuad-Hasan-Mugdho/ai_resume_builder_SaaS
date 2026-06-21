'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Input, Textarea } from '@/components/ui';

export default function AiAssistantPage() {
  const [message, setMessage] = useState('');
  const [context, setContext] = useState('I am applying for software engineer jobs');
  const [reply, setReply] = useState('');

  async function ask(e: FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await api.post('/ai/chat-assistant', { message, context }, { headers: { Authorization: `Bearer ${token}` } });
    setReply(res.data.reply || 'No response');
  }

  return (
    <Card>
      <h1 className="mb-4 text-2xl font-bold">AI Career Assistant</h1>
      <form onSubmit={ask} className="space-y-3">
        <Textarea rows={3} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Your career context" />
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask for resume/career help" />
        <Button type="submit">Ask Assistant</Button>
      </form>
      <pre className="mt-4 whitespace-pre-wrap text-sm">{reply}</pre>
    </Card>
  );
}
