'use client';

import { cn } from '@/lib/cn';
import { Toggle } from '../Controls';

interface ToggleRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}

/** A switch with its text beside it; clicking the text flips the switch too. */
export function ToggleRow({ checked, onChange, label, hint, className }: ToggleRowProps) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Toggle checked={checked} onChange={onChange} label={label} />
      <button type="button" onClick={() => onChange(!checked)} className="text-left text-[13px]">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-ink-mute">{hint}</span>}
      </button>
    </div>
  );
}
