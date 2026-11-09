import type { Metadata } from 'next';
import { AdminProviders } from '@/store/admin/AdminProviders';
import '@/styles/admin.css';

/** The dashboard is private: never indexed, never cached by shared caches. */
export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | Riad Threads dashboard' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <div className="min-h-screen bg-admin-bg text-[14.5px] leading-[1.45]">{children}</div>
    </AdminProviders>
  );
}
