import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://resumeai-pro.example.com';
  return ['', '/pricing', '/blog', '/resume-examples', '/ats-guide'].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));
}
