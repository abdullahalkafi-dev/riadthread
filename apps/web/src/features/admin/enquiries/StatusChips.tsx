import type { EnquiryStatus } from '@riad/shared';
import { Chip } from '@/components/admin';
import { PIPELINE, statusLabel } from './statusMeta';

interface StatusChipsProps {
  active: EnquiryStatus | undefined;
  counts: Record<string, number>;
  onChange: (status: EnquiryStatus | undefined) => void;
}

/** "All" plus one chip per stage, each with its live count. Spam sits last, out of the way. */
export function StatusChips({ active, counts, onChange }: StatusChipsProps) {
  const all = PIPELINE.reduce((n, s) => n + (counts[s] ?? 0), 0);
  return (
    <div className="mb-3.5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
      <Chip active={!active} count={all} onClick={() => onChange(undefined)}>
        All
      </Chip>
      {[...PIPELINE, 'spam' as const].map((s) => (
        <Chip key={s} active={active === s} count={counts[s] ?? 0} onClick={() => onChange(s)}>
          {statusLabel(s)}
        </Chip>
      ))}
    </div>
  );
}
