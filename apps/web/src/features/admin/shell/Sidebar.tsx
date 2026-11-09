'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconButton } from '@/components/admin';
import { cn } from '@/lib/cn';
import type { AdminUser } from '@/types/api';
import { isActive, NAV } from './nav';

interface SidebarProps {
  user: AdminUser;
  newCount: number;
  open: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

export function Sidebar({ user, newCount, open, onNavigate, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'z-[80] flex h-screen w-[272px] flex-col overflow-auto bg-night-900 bg-[radial-gradient(80%_40%_at_0%_0%,rgba(207,174,106,.12),transparent_70%)] text-[#d9cdb9] transition-transform duration-300 max-[900px]:fixed max-[900px]:inset-y-0 max-[900px]:left-0 min-[901px]:sticky min-[901px]:top-0 min-[901px]:w-auto',
        open ? 'max-[900px]:translate-x-0' : 'max-[900px]:-translate-x-full',
      )}
    >
      <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-5">
        <Image src="/brand/favicon.png" alt="" width={38} height={38} className="h-[38px] w-[38px] rounded-[10px] bg-night-800 object-cover" />
        <div>
          <b className="block font-display text-[19px] font-normal leading-[1.05] text-white">Riad Threads</b>
          <span className="block text-[11px] uppercase tracking-[.14em] text-brass-400">Wholesale admin</span>
        </div>
      </div>
      <div className="admin-zellige my-1.5 mb-2.5" />

      <nav aria-label="Dashboard" className="flex flex-col gap-0.5 px-3 py-1">
        {NAV.map((group, i) => (
          <div key={group.heading ?? i} className="flex flex-col gap-0.5">
            {group.heading && (
              <h4 className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[.16em] text-[#8d806c]">{group.heading}</h4>
            )}
            {group.items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-[11px] rounded-[10px] px-2.5 py-[9px] transition',
                    active
                      ? 'bg-gradient-to-r from-terracotta-500/90 to-terracotta-500/65 font-semibold text-white'
                      : 'hover:bg-white/[.06] hover:text-white',
                  )}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {item.showNewCount && newCount > 0 && (
                    <span
                      className={cn(
                        'ml-auto rounded-full px-2 py-px text-[11px] font-bold',
                        active ? 'bg-white text-terracotta-600' : 'bg-brass-400 text-night-900',
                      )}
                    >
                      {newCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-white/[.08] px-4 py-3.5">
        <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-t-full bg-brass-400 text-[13px] font-bold text-night-900">
          {initials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-white">{user.name}</b>
          <small className="block truncate text-[11.5px] text-[#8d806c]">{user.email}</small>
        </div>
        <IconButton onClick={onSignOut} aria-label="Sign out" title="Sign out" className="!h-[34px] !w-[34px] border-white/15 bg-transparent text-[#d9cdb9] hover:border-white/30">
          <Icon name="logout" />
        </IconButton>
      </div>
    </aside>
  );
}
