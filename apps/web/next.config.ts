import type { NextConfig } from 'next';

/**
 * The browser only ever talks to this origin. /api goes to the Express API and
 * /media to the public storage bucket, so cookies are same-site and no CORS is needed.
 */
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
const mediaUrl = process.env.MEDIA_ORIGIN ?? 'http://localhost:8333/riad-public';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@riad/shared'],
  images: { unoptimized: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/media/:path*', destination: `${mediaUrl}/:path*` },
    ];
  },
};

export default config;
