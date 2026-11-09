import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from '@riad/shared';
import { cn } from '@/lib/cn';

export type BadgeTone =
  | EnquiryStatus
  | 'draft'
  | 'published'
  | 'archived'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'neutral';

const tones: Record<BadgeTone, string> = {
  new: 'bg-[#f8e3d9] text-terracotta-600',
  contacted: 'bg-[#e1e8fb] text-majorelle-600',
  discussion: 'bg-[#f4ead0] text-[#7d6226]',
  quote: 'bg-[#d9efec] text-zellige-600',
  confirmed: 'bg-[#d6efe0] text-admin-ok',
  lost: 'bg-[#ebe5db] text-[#7a6d5d]',
  spam: 'bg-[#f1dcd6] text-admin-danger',
  draft: 'bg-[#ebe5db] text-[#7a6d5d]',
  published: 'bg-[#d6efe0] text-admin-ok',
  archived: 'bg-[#f1dcd6] text-admin-danger',
  processing: 'bg-[#f4ead0] text-[#7d6226]',
  ready: 'bg-[#d6efe0] text-admin-ok',
  failed: 'bg-[#f1dcd6] text-admin-danger',
  neutral: 'bg-sand-200 text-ink-soft',
};

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

/** A coloured pill with a leading dot, used for statuses everywhere in the dashboard. */
export function Badge({ tone, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold before:h-[7px] before:w-[7px] before:rounded-full before:bg-current before:content-[""]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status, className }: { status: EnquiryStatus; className?: string }) {
  return (
    <Badge tone={status} className={className}>
      {ENQUIRY_STATUS_LABELS[status]}
    </Badge>
  );
}

const scoreTones = {
  hot: 'bg-[#fbd9cf] text-[#9c2f16]',
  warm: 'bg-[#f6e7bd] text-[#7a5d12]',
  cold: 'bg-[#e4ecf3] text-[#445a70]',
} as const;

export function ScoreBadge({ level }: { level: keyof typeof scoreTones }) {
  return (
    <span className={cn('rounded-lg px-[9px] py-[3px] text-xs font-bold capitalize', scoreTones[level])}>{level}</span>
  );
}
