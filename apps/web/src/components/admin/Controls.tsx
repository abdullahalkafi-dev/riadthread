'use client';

import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; the visible label usually sits next to the switch. */
  label: string;
  disabled?: boolean;
}

/** An on/off switch (role="switch"). */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[23px] w-10 flex-none rounded-full transition disabled:opacity-50',
        checked ? 'bg-zellige-500' : 'bg-sand-300',
      )}
    >
      <span
        className={cn(
          'absolute left-[3px] top-[3px] h-[17px] w-[17px] rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-[17px]',
        )}
      />
    </button>
  );
}

interface ChipProps {
  active?: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}

/** A filter chip with an optional count, e.g. "New 4". */
export function Chip({ active, count, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition',
        active ? 'border-ink bg-ink text-white' : 'border-admin-line bg-white text-ink-soft hover:border-sand-400',
      )}
    >
      {children}
      {count !== undefined && <b className={cn('font-bold', active ? 'text-brass-300' : 'text-ink')}>{count}</b>}
    </button>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: IconName }>;
  label: string;
}

/** A small two- or three-way switch, e.g. Table | Board. */
export function Segmented<T extends string>({ value, onChange, options, label }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-[11px] bg-sand-200 p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-[9px] px-[13px] py-1.5 text-[13px] font-semibold transition',
            o.value === value ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,.12)]' : 'text-ink-soft',
          )}
        >
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{ value: T; label: React.ReactNode }>;
}

/** Underlined tabs used inside editors. */
export function Tabs<T extends string>({ value, onChange, tabs }: TabsProps<T>) {
  return (
    <div role="tablist" className="mb-[18px] flex gap-1 overflow-x-auto border-b border-admin-line">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn(
            'whitespace-nowrap border-b-2 px-4 py-2.5 font-semibold transition',
            t.value === value ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-ink-soft hover:text-ink',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
