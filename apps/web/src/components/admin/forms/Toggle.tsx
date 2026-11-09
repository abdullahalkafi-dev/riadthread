import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text next to the switch; also its accessible name. */
  label?: string;
  /** Required when there is no visible label. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** An on/off switch (role="switch"), styled as in the dashboard design. */
export function Toggle({ checked, onChange, label, ariaLabel, disabled, className }: ToggleProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[23px] w-10 flex-none rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-zellige-500' : 'bg-sand-300',
        !label && className,
      )}
    >
      <span
        className={cn(
          'absolute left-[3px] top-[3px] h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform',
          checked && 'translate-x-[17px]',
        )}
      />
    </button>
  );
  if (!label) return control;
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-[13px]', className)}>
      {control}
      <span>{label}</span>
    </label>
  );
}
