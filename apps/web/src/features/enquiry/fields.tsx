'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: 'text' | 'email' | 'tel' | 'date';
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  /** Renders a multi-line box with this many rows instead of a single line. */
  rows?: number;
  readOnly?: boolean;
  /** Shows the label above the box (design: full form). Without it the label is only read by screen readers. */
  showLabel?: boolean;
  className?: string;
}

/** A labelled text box with its validation message, wired for screen readers. */
export function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  required,
  rows,
  readOnly,
  showLabel = true,
  className,
}: FieldProps) {
  const id = useId();
  const common = {
    id,
    value,
    placeholder,
    autoComplete,
    readOnly,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
    className: cn('field', error && '!border-terracotta-600', readOnly && 'font-medium text-terracotta-600'),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div className={className}>
      <label htmlFor={id} className={showLabel ? 'label' : 'sr-only'}>
        {label}
        {required && showLabel ? ' *' : ''}
      </label>
      {rows ? <textarea {...common} rows={rows} /> : <input {...common} type={type} />}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface GroupProps<T extends string> {
  legend: string;
  name: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | '';
  onChange: (value: T) => void;
}

/** Pill-shaped single choice, e.g. type of business. */
export function ChipGroup<T extends string>({ legend, name, options, value, onChange }: GroupProps<T>) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2 text-sm">
        {options.map((o) => (
          <label key={o.value} className="chip cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="inline-block rounded-full border border-ink/20 px-4 py-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-terracotta-500">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Connected segmented control, e.g. best way to reach you. */
export function SegGroup<T extends string>({ legend, name, options, value, onChange }: GroupProps<T>) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="inline-flex rounded-full bg-sand-200 p-1 text-sm">
        {options.map((o) => (
          <label key={o.value} className="seg cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="block rounded-full px-4 py-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-terracotta-500">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
