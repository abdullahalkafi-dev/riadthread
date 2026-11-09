import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * Table primitives. On phones the header disappears and each row becomes a
 * stacked card, because the owner checks enquiries on his phone.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <table className={cn('w-full border-separate border-spacing-0 max-sm:block', className)} {...props} />;
}

export function THead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('max-sm:hidden', className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('max-sm:block', className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'border-b border-admin-line bg-sand-50 px-3.5 py-[11px] text-left text-[11px] font-semibold uppercase tracking-[.1em] text-ink-mute first:rounded-tl-card last:rounded-tr-card',
        className,
      )}
      {...props}
    />
  );
}

interface TrProps extends ComponentProps<'tr'> {
  /** Makes the whole row a button-like target. */
  onActivate?: () => void;
}

export function Tr({ className, onActivate, ...props }: TrProps) {
  return (
    <tr
      className={cn(
        'group max-sm:block max-sm:border-b max-sm:border-admin-line max-sm:px-3.5 max-sm:py-3',
        onActivate && 'cursor-pointer',
        className,
      )}
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      tabIndex={onActivate ? 0 : undefined}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'border-b border-admin-line px-3.5 py-3 align-middle group-last:border-b-0 group-hover:bg-sand-50 max-sm:block max-sm:border-0 max-sm:px-0 max-sm:py-[3px] max-sm:group-hover:bg-transparent',
        className,
      )}
      {...props}
    />
  );
}
