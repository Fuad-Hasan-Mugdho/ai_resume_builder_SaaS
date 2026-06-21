'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { Education, emptyResume, Experience, Project, ResumeData } from '@/types/resume';
import { useRequireAuth } from '@/hooks/use-require-auth';

type StoredResume = { id: string; title: string; resumeDataJson: ResumeData };
type ResumeTemplate = { id: string; name: string; isPremium: boolean };
type ResumePayment = { resumeId?: string; status: string; accessExpiresAt?: string };

const labels = {
  en: { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', awards: 'Awards' },
  bn: { summary: 'পেশাগত সারসংক্ষেপ', experience: 'কর্ম অভিজ্ঞতা', education: 'শিক্ষা', skills: 'দক্ষতা', projects: 'প্রকল্প', certifications: 'সনদ', awards: 'পুরস্কার' },
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
}

export default function ResumeBuilderPage() {
  const authReady = useRequireAuth();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('My Professional Resume');
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [currentId, setCurrentId] = useState<string>();
  const [paidResumeIds, setPaidResumeIds] = useState<string[]>([]);
  const [exportAuthorized, setExportAuthorized] = useState(false);
  const [message, setMessage] = useState('');
  const t = labels[data.language];
  const steps = ['Basic', 'Experience', 'Skills', 'Optional', 'Review'];

  async function loadResumes() {
    if (!localStorage.getItem('token')) return;
    const [resumeResult, paymentResult, templateResult] = await Promise.all([
      api.get('/resumes', { headers: authHeaders() }),
      api.get('/payments/manual/status', { headers: authHeaders() }),
      api.get('/templates'),
    ]);
    setResumes(resumeResult.data);
    setPaidResumeIds(paymentResult.data
      .filter((payment: ResumePayment) => payment.resumeId && payment.status === 'APPROVED' && payment.accessExpiresAt && new Date(payment.accessExpiresAt) > new Date())
      .map((payment: ResumePayment) => payment.resumeId as string));
    setTemplates(templateResult.data);
    const requestedId = new URLSearchParams(window.location.search).get('resumeId');
    const requestedResume = resumeResult.data.find((resume: StoredResume) => resume.id === requestedId);
    if (requestedResume) loadResume(requestedResume);
  }

  useEffect(() => { loadResumes(); }, []);

  useEffect(() => {
    if (!currentId) return;
    const timer = window.setTimeout(async () => {
      await api.put(`/resumes/${currentId}`, { title, resumeDataJson: data }, { headers: authHeaders() });
      setMessage('Auto-saved');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [currentId, data, title]);

  function setPersonal(field: keyof ResumeData['personal'], value: string) {
    setData((old) => ({ ...old, personal: { ...old.personal, [field]: value } }));
  }

  function updateArray<T extends keyof ResumeData>(key: T, index: number, value: unknown) {
    setData((old) => {
      const items = [...(old[key] as unknown[])];
      items[index] = value;
      return { ...old, [key]: items };
    });
  }

  function removeArray<T extends keyof ResumeData>(key: T, index: number) {
    setData((old) => ({ ...old, [key]: (old[key] as unknown[]).filter((_, i) => i !== index) }));
  }

  async function createResume(e: FormEvent) {
    e.preventDefault();
    const result = await api.post('/resumes', { title, resumeDataJson: data }, { headers: authHeaders() });
    setCurrentId(result.data.id);
    setExportAuthorized(false);
    setMessage('Resume created. Auto-save is active.');
    loadResumes();
  }

  async function deleteResume(id: string) {
    await api.delete(`/resumes/${id}`, { headers: authHeaders() });
    if (currentId === id) setCurrentId(undefined);
    loadResumes();
  }

  function loadResume(resume: StoredResume) {
    setCurrentId(resume.id);
    setExportAuthorized(false);
    setTitle(resume.title);
    setData({ ...emptyResume, ...resume.resumeDataJson });
    setMessage('Resume loaded. Changes will auto-save.');
  }

  async function exportPdf() {
    if (!currentId) {
      setMessage('Create or load a saved resume before exporting.');
      return;
    }
    await api.post(`/resumes/${currentId}/export-authorize`, {}, { headers: authHeaders() });
    setExportAuthorized(true);
    setMessage('PDF download authorized. You can download this CV throughout the 7-day access period.');
    window.setTimeout(() => window.print(), 150);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= data.sectionOrder.length) return;
    const order = [...data.sectionOrder];
    [order[index], order[destination]] = [order[destination], order[index]];
    setData((old) => ({ ...old, sectionOrder: order }));
  }

  const previewStyle = useMemo(() => ({
    fontSize: `${data.design.fontSize}px`,
    color: '#172033',
    fontFamily: data.design.font === 'serif' ? 'Georgia, serif' : data.design.font === 'mono' ? 'monospace' : 'Helvetica, sans-serif',
    gap: `${data.design.spacing}px`,
  }), [data.design]);

  function previewSection(section: string) {
    const heading = <h3 className="mb-2 border-b pb-1 font-bold uppercase" style={{ color: data.design.themeColor }}>{t[section as keyof typeof t]}</h3>;
    if (section === 'summary' && data.summary) return <section key={section}>{heading}<p>{data.summary}</p></section>;
    if (section === 'experience' && data.experiences.length) return <section key={section}>{heading}{data.experiences.map((x, i) => <div key={i} className="mb-3"><b>{x.position} · {x.company}</b><p className="text-xs">{x.startDate} – {x.current ? 'Present' : x.endDate}</p><p>{x.responsibilities}</p><p>{x.achievements}</p></div>)}</section>;
    if (section === 'education' && data.education.length) return <section key={section}>{heading}{data.education.map((x, i) => <div key={i} className="mb-2"><b>{x.degree} in {x.subject}</b><p>{x.institute} · {x.startYear}–{x.endYear} · GPA {x.gpa}</p></div>)}</section>;
    if (section === 'skills') return <section key={section}>{heading}<p><b>Technical:</b> {data.skills.technical}</p><p><b>Soft:</b> {data.skills.soft}</p><p><b>Languages:</b> {data.skills.languages}</p></section>;
    if (section === 'projects' && data.projects.length) return <section key={section}>{heading}{data.projects.map((x, i) => <div key={i} className="mb-2"><b>{x.title}</b><p>{x.description}</p><p>{x.technologies}</p></div>)}</section>;
    if (section === 'certifications' && data.certifications.length) return <section key={section}>{heading}{data.certifications.map((x, i) => <p key={i}>{x.name} · {x.issuer} · {x.date}</p>)}</section>;
    if (section === 'awards' && data.awards) return <section key={section}>{heading}<p>{data.awards}</p></section>;
    return null;
  }

  if (!authReady) return <p className="py-20 text-center">Please login to create your CV…</p>;
  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Create Your CV</h1><p className="text-sm text-slate-600">Complete one easy step at a time.</p></div>
        <Button onClick={exportPdf}>Download PDF</Button>
      </div>

      <div className="no-print grid grid-cols-5 overflow-hidden rounded-xl border bg-white text-center text-xs">
        {steps.map((label, index) => <button key={label} type="button" className={`p-2 ${step === index ? 'bg-brand font-bold text-white' : ''}`} onClick={() => setStep(index)}><span className="block">{index + 1}</span><span className="hidden sm:block">{label}</span></button>)}
      </div>

      <div className="resume-workspace grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <form className={`no-print wizard-form wizard-step-${step} space-y-4`} onSubmit={createResume}>
          <Card className="space-y-3">
            <h2 className="text-xl font-bold">Document & design</h2>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title" />
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded-xl border p-2" value={data.language} onChange={(e) => setData({ ...data, language: e.target.value as 'en' | 'bn' })}><option value="en">English</option><option value="bn">বাংলা</option></select>
              <select className="rounded-xl border p-2" value={data.design.template} onChange={(e) => setData({ ...data, design: { ...data.design, template: e.target.value as ResumeData['design']['template'] } })}><option value="minimal">Minimal</option><option value="modern">Modern</option><option value="creative">Creative</option></select>
              <select className="rounded-xl border p-2" value={data.design.font} onChange={(e) => setData({ ...data, design: { ...data.design, font: e.target.value as ResumeData['design']['font'] } })}><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select>
              <Input type="color" value={data.design.themeColor} onChange={(e) => setData({ ...data, design: { ...data.design, themeColor: e.target.value } })} />
              <Input type="number" min="11" max="20" value={data.design.fontSize} onChange={(e) => setData({ ...data, design: { ...data.design, fontSize: Number(e.target.value) } })} />
              <Input type="number" min="8" max="32" value={data.design.spacing} onChange={(e) => setData({ ...data, design: { ...data.design, spacing: Number(e.target.value) } })} />
            </div>
            {templates.length > 0 && <p className="text-xs text-slate-500">Available from admin: {templates.map((template) => `${template.name}${template.isPremium ? ' (Premium)' : ''}`).join(', ')}</p>}
          </Card>

          <Card className="space-y-2"><h2 className="text-xl font-bold">Personal information</h2>{Object.entries(data.personal).map(([key, value]) => <Input key={key} value={value} onChange={(e) => setPersonal(key as keyof ResumeData['personal'], e.target.value)} placeholder={key.replace(/([A-Z])/g, ' $1')} />)}</Card>

          <Card className="space-y-2"><h2 className="text-xl font-bold">Summary</h2><p className="text-sm text-slate-500">Write a short introduction about your experience and strengths.</p><Textarea rows={5} value={data.summary} onChange={(e) => setData({ ...data, summary: e.target.value })} placeholder="Example: Experienced software engineer skilled in building reliable web applications..." /></Card>

          <Card className="space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">Experience</h2><Button type="button" onClick={() => setData({ ...data, experiences: [...data.experiences, { company: '', position: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '' }] })}>Add</Button></div>{data.experiences.map((x, i) => <Entry key={i} onRemove={() => removeArray('experiences', i)}>{(['company', 'position', 'startDate', 'endDate'] as const).map((field) => <Input key={field} value={x[field] as string} placeholder={field} onChange={(e) => updateArray('experiences', i, { ...x, [field]: e.target.value } as Experience)} />)}<Textarea value={x.responsibilities} placeholder="Responsibilities" onChange={(e) => updateArray('experiences', i, { ...x, responsibilities: e.target.value })} /><Textarea value={x.achievements} placeholder="Achievements" onChange={(e) => updateArray('experiences', i, { ...x, achievements: e.target.value })} /><label className="text-sm"><input type="checkbox" checked={x.current} onChange={(e) => updateArray('experiences', i, { ...x, current: e.target.checked })} /> Current job</label></Entry>)}</Card>

          <Card className="space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">Education</h2><Button type="button" onClick={() => setData({ ...data, education: [...data.education, { institute: '', degree: '', subject: '', gpa: '', startYear: '', endYear: '' }] })}>Add</Button></div>{data.education.map((x, i) => <Entry key={i} onRemove={() => removeArray('education', i)}>{(['institute', 'degree', 'subject', 'gpa', 'startYear', 'endYear'] as const).map((field) => <Input key={field} value={x[field]} placeholder={field} onChange={(e) => updateArray('education', i, { ...x, [field]: e.target.value } as Education)} />)}</Entry>)}</Card>

          <Card className="space-y-2"><h2 className="text-xl font-bold">Skills</h2>{(['technical', 'soft', 'languages'] as const).map((field) => <Input key={field} value={data.skills[field]} placeholder={`${field} skills`} onChange={(e) => setData({ ...data, skills: { ...data.skills, [field]: e.target.value } })} />)}</Card>

          <Card className="space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">Projects</h2><Button type="button" onClick={() => setData({ ...data, projects: [...data.projects, { title: '', description: '', technologies: '', githubUrl: '', liveUrl: '' }] })}>Add</Button></div>{data.projects.map((x, i) => <Entry key={i} onRemove={() => removeArray('projects', i)}>{(['title', 'description', 'technologies', 'githubUrl', 'liveUrl'] as const).map((field) => <Input key={field} value={x[field]} placeholder={field} onChange={(e) => updateArray('projects', i, { ...x, [field]: e.target.value } as Project)} />)}</Entry>)}</Card>

          <Card className="space-y-3"><div className="flex justify-between"><h2 className="text-xl font-bold">Certifications</h2><Button type="button" onClick={() => setData({ ...data, certifications: [...data.certifications, { name: '', issuer: '', date: '' }] })}>Add</Button></div>{data.certifications.map((x, i) => <Entry key={i} onRemove={() => removeArray('certifications', i)}>{(['name', 'issuer', 'date'] as const).map((field) => <Input key={field} value={x[field]} placeholder={field} onChange={(e) => updateArray('certifications', i, { ...x, [field]: e.target.value })} />)}</Entry>)}</Card>

          <Card><h2 className="mb-2 text-xl font-bold">Awards</h2><Textarea value={data.awards} onChange={(e) => setData({ ...data, awards: e.target.value })} /></Card>

          <Card><h2 className="mb-2 text-xl font-bold">Section order</h2>{data.sectionOrder.map((section, i) => <div key={section} className="flex items-center justify-between border-b py-2"><span>{t[section as keyof typeof t]}</span><div className="flex gap-1"><button type="button" onClick={() => moveSection(i, -1)}>↑</button><button type="button" onClick={() => moveSection(i, 1)}>↓</button></div></div>)}</Card>
          <Button type="submit">Create & enable auto-save</Button><p className="text-sm text-green-700">{message}</p>

          <Card><h2 className="mb-2 text-xl font-bold">Saved CVs</h2>{resumes.map((resume) => <div key={resume.id} className="flex justify-between border-b py-2"><button type="button" onClick={() => loadResume(resume)}>{resume.title}</button><button type="button" className="text-red-600" onClick={() => deleteResume(resume.id)}>Delete</button></div>)}</Card>
          <div className="wizard-controls flex justify-between gap-2 pt-2"><Button type="button" className={step === 0 ? 'invisible' : ''} onClick={() => setStep(Math.max(0, step - 1))}>Back</Button>{step < 4 && <Button type="button" onClick={() => setStep(Math.min(4, step + 1))}>Continue</Button>}</div>
        </form>

        <article className={`resume-preview relative flex min-h-[1120px] flex-col bg-white p-10 shadow-xl template-${data.design.template}`} style={previewStyle}>
          {(!currentId || (!paidResumeIds.includes(currentId) && !exportAuthorized)) && <div className="watermark">Preview · Pay ৳20 for this CV</div>}
          <header className="mb-6 border-b-4 pb-4" style={{ borderColor: data.design.themeColor }}><h1 className="text-4xl font-bold" style={{ color: data.design.themeColor }}>{data.personal.fullName || 'Your Name'}</h1><p>{[data.personal.email, data.personal.phone, data.personal.address].filter(Boolean).join(' · ')}</p><p>{[data.personal.linkedinUrl, data.personal.githubUrl, data.personal.portfolioUrl].filter(Boolean).join(' · ')}</p></header>
          <div className="flex flex-col" style={{ gap: `${data.design.spacing}px` }}>{data.sectionOrder.map(previewSection)}</div>
        </article>
      </div>
    </div>
  );
}

function Entry({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return <div className="grid gap-2 rounded-xl border p-3"><button type="button" className="justify-self-end text-sm text-red-600" onClick={onRemove}>Remove</button>{children}</div>;
}
