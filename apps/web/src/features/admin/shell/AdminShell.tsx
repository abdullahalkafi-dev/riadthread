'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QueryError, ToastHost } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLogoutMutation, useMeQuery } from '@/store/admin/authApi';
import { useGetOverviewQuery } from '@/store/admin/overviewApi';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

function ShellSkeleton() {
  return (
    <div className="grid min-h-screen min-[901px]:grid-cols-[248px_1fr]" aria-busy>
      <div className="hidden bg-night-900 min-[901px]:block" />
      <div className="space-y-5 p-7">
        <Skeleton className="h-10 w-full max-w-[460px]" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-3.5 min-[1101px]:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The signed-in frame around every dashboard page. The API is the real gate:
 * if "who am I" fails (after the one automatic session refresh), the visitor is
 * sent to the sign-in page and brought back afterwards.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useMeQuery();
  const [signOut] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Polls gently so the "new" badge notices enquiries that arrive while the page is open.
  const overview = useGetOverviewQuery(undefined, { skip: !me.isSuccess, pollingInterval: 60_000 });

  const unauthorised = (me.error as { status?: number } | undefined)?.status === 401;
  useEffect(() => {
    if (unauthorised) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [unauthorised, pathname, router]);

  // Close the phone menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  if (me.isLoading || unauthorised) return <ShellSkeleton />;
  if (me.isError || !me.data) {
    return (
      <div className="mx-auto max-w-lg pt-24">
        <QueryError error={me.error} onRetry={me.refetch} />
      </div>
    );
  }

  const newCount = overview.data?.newCount ?? 0;

  async function handleSignOut() {
    await signOut();
    router.replace('/admin/login');
  }

  return (
    <div className="min-h-screen min-[901px]:grid min-[901px]:grid-cols-[248px_1fr]">
      <Sidebar user={me.data} newCount={newCount} open={menuOpen} onNavigate={() => setMenuOpen(false)} onSignOut={handleSignOut} />
      {menuOpen && <div className="fixed inset-0 z-[75] bg-night-900/45 min-[901px]:hidden" onClick={() => setMenuOpen(false)} aria-hidden />}
      <div className="min-w-0">
        <Topbar newCount={newCount} onMenu={() => setMenuOpen(true)} />
        <main className="px-4 pb-24 pt-[18px] min-[901px]:px-8 min-[901px]:pb-20 min-[901px]:pt-[26px]">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
