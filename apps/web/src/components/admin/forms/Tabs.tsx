import { cn } from '@/lib/cn';

export interface TabItem<K extends string> {
  key: K;
  label: string;
  /** Small marker for a tab that still needs attention. */
  warn?: boolean;
  count?: number;
}

interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  className?: string;
}

/** Underlined tab bar (editor sections). Scrolls sideways on narrow screens. */
export function Tabs<K extends string>({ items, active, onChange, className }: TabsProps<K>) {
  return (
    <div role="tablist" className={cn('mb-[18px] flex gap-1 overflow-x-auto border-b border-admin-line', className)}>
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          onClick={() => onChange(t.key)}
          className={cn(
            'whitespace-nowrap border-b-2 px-4 py-2.5 font-semibold transition',
            t.key === active ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-ink-soft hover:text-ink',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-ink-mute">{t.count}</span>}
          {t.warn && <span className="ml-[7px] inline-block h-2 w-2 rounded-full bg-terracotta-500" title="Needs attention" />}
        </button>
      ))}
    </div>
  );
}
