/** Server-side configuration. Nothing here is ever sent to the browser. */
export const serverEnv = {
  /** Where the Express API listens, as seen from the web server. */
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',
  /** Lets the web server's own calls skip the per-IP rate limits. */
  internalKey: process.env.INTERNAL_API_SECRET ?? '',
  /** Public address of the site, used for canonical URLs and the sitemap. */
  siteUrl: (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  /** Staging addresses stay out of search results. */
  noindex: process.env.NOINDEX === 'true',
  revalidateSecret: process.env.REVALIDATE_SECRET ?? '',
};
