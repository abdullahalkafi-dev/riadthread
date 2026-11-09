import type { MetadataRoute } from 'next';
import { serverEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  // A staging address must stay out of search results entirely.
  if (serverEnv.noindex) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${serverEnv.siteUrl}/sitemap.xml`,
    host: serverEnv.siteUrl,
  };
}
