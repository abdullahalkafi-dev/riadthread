import { cn } from '@/lib/cn';
import { Icon } from './Icon';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
      <div>
        <h1 className="font-display text-[26px] font-normal leading-[1.1] sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1 text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, className }: { title?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-9 text-center text-ink-soft', className)}>
      {title && <p className="font-semibold text-ink">{title}</p>}
      {children && <div className={title ? 'mt-1' : undefined}>{children}</div>}
    </div>
  );
}

interface CalloutProps {
  tone?: 'info' | 'warn' | 'error';
  children: React.ReactNode;
  className?: string;
}

const calloutTones = {
  info: 'bg-[#eef1fc] text-[#24378a]',
  warn: 'bg-[#f8efd6] text-[#6b5217]',
  error: 'bg-[#fdf2ef] text-admin-danger',
} as const;

export function Callout({ tone = 'info', children, className }: CalloutProps) {
  return (
    <div className={cn('flex gap-2.5 rounded-xl px-3.5 py-3 text-[13px]', calloutTones[tone], className)} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={tone === 'error' ? 'alert' : 'info'} className="mt-px" />
      <div>{children}</div>
    </div>
  );
}

interface ThumbsProps {
  urls: string[];
  /** Total number of products, when more than the shown thumbnails. */
  total?: number;
}

/** Up to three overlapping arch-shaped thumbnails, plus a "+n" bubble. */
export function Thumbs({ urls, total }: ThumbsProps) {
  const shown = urls.slice(0, 3);
  const more = (total ?? urls.length) - shown.length;
  const arch =
    'h-14 w-11 flex-none rounded-t-full rounded-b-md border-2 border-white bg-sand-200 object-cover shadow-[0_0_0_1px_#e6dccb]';
  return (
    <div className="flex">
      {shown.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- small stored thumbnails, no srcset needed
        <img key={url + i} src={url} alt="" loading="lazy" className={cn(arch, i > 0 && '-ml-3.5')} />
      ))}
      {shown.length === 0 && <div className={cn(arch, 'grid place-items-center text-ink-mute')}><Icon name="img" /></div>}
      {more > 0 && (
        <div className={cn(arch, '-ml-3.5 grid place-items-center text-xs font-bold')}>+{more}</div>
      )}
    </div>
  );
}
