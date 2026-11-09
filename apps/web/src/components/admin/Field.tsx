import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-[10px] border border-admin-line bg-white px-3 py-2.5 text-[14.5px] outline-none transition placeholder:text-ink-mute focus:border-terracotta-500 focus:ring-4 focus:ring-terracotta-500/10 disabled:bg-sand-100 disabled:text-ink-mute';
const invalid = 'border-admin-danger bg-[#fdf2ef]';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  /** Message from the API or from validation; turns the hint red. */
  error?: string | undefined;
  className?: string;
  children: React.ReactNode;
}

/** Label, control and message, laid out the same way on every form. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p className={cn('mt-1 text-xs', error ? 'text-admin-danger' : 'text-ink-mute')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, invalid: isInvalid, ...props }: ComponentProps<'input'> & { invalid?: boolean }) {
  return <input className={cn(control, isInvalid && invalid, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-[92px] resize-y', className)} {...props} />;
}
