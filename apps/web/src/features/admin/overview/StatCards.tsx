import type { CSSProperties } from 'react';
import { Card } from '@/components/admin';
import type { Overview } from '@/types/api';

interface Stat {
  label: string;
  value: number;
  note: string;
  /** Tint of the disc in the card's corner. */
  accent: string;
}

const statsFrom = (o: Overview): Stat[] => [
  { label: 'New enquiries', value: o.newCount, note: 'waiting for first reply', accent: '#f8e3d9' },
  { label: 'Open leads', value: o.openLeads, note: 'in progress', accent: '#e1e8fb' },
  { label: 'Confirmed', value: o.confirmedThisMonth, note: 'this month', accent: '#d6efe0' },
  { label: 'Hot leads', value: o.hotOpen, note: 'worth a call today', accent: '#f6e7bd' },
];

export function StatCards({ overview }: { overview: Overview }) {
  return (
    <div className="mb-[18px] grid grid-cols-2 gap-2.5 min-[1101px]:grid-cols-4 min-[1101px]:gap-3.5">
      {statsFrom(overview).map((s) => (
        // The tint is data (one colour per card), so it travels as a CSS variable read by .admin-stat.
        <Card key={s.label} style={{ '--accent': s.accent } as CSSProperties} className="admin-stat relative overflow-hidden px-[18px] py-4">
          <div className="text-[12.5px] font-semibold text-ink-soft">{s.label}</div>
          <div className="mt-1 font-display text-[30px] leading-[1.1] sm:text-[38px]">{s.value}</div>
          <div className="text-xs text-ink-mute">{s.note}</div>
        </Card>
      ))}
    </div>
  );
}
