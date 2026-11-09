import type { Metadata, Viewport } from 'next';
import { Aref_Ruqaa, Gloock, Instrument_Sans } from 'next/font/google';
import { serverEnv } from '@/lib/env';
import './globals.css';

const display = Gloock({ weight: '400', subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const ruqaa = Aref_Ruqaa({ weight: ['400', '700'], subsets: ['arabic', 'latin'], variable: '--font-ruqaa', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(serverEnv.siteUrl),
  title: {
    default: 'Riad Threads | Moroccan wholesale for UK retailers',
    template: '%s | Riad Threads',
  },
  description:
    'Moroccan wholesale for UK retailers: djellabas, gandoras, jabadors and prayer essentials, hand-finished in Fez and stocked in the UK.',
  icons: { icon: '/brand/favicon.png' },
  openGraph: { siteName: 'Riad Threads', locale: 'en_GB', type: 'website', images: ['/brand/og-image.jpg'] },
  // Staging addresses must never appear in search results.
  ...(serverEnv.noindex ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#fbf8f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} ${ruqaa.variable}`}>
      <body>{children}</body>
    </html>
  );
}
