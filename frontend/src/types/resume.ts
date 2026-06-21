export type ResumeLanguage = 'en' | 'bn';

export type Experience = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
  achievements: string;
};

export type Education = {
  institute: string;
  degree: string;
  subject: string;
  gpa: string;
  startYear: string;
  endYear: string;
};

export type Project = {
  title: string;
  description: string;
  technologies: string;
  githubUrl: string;
  liveUrl: string;
};

export type ResumeData = {
  language: ResumeLanguage;
  personal: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
    profileImage: string;
  };
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: {
    technical: string;
    soft: string;
    languages: string;
  };
  projects: Project[];
  certifications: Array<{ name: string; issuer: string; date: string }>;
  awards: string;
  sectionOrder: string[];
  design: {
    template: 'minimal' | 'modern' | 'creative';
    font: 'serif' | 'sans' | 'mono';
    fontSize: number;
    themeColor: string;
    spacing: number;
  };
};

export const emptyResume: ResumeData = {
  language: 'en',
  personal: {
    fullName: '', email: '', phone: '', address: '', linkedinUrl: '',
    portfolioUrl: '', githubUrl: '', profileImage: '',
  },
  summary: '',
  experiences: [],
  education: [],
  skills: { technical: '', soft: '', languages: '' },
  projects: [],
  certifications: [],
  awards: '',
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards'],
  design: { template: 'minimal', font: 'sans', fontSize: 14, themeColor: '#1d4ed8', spacing: 16 },
};
