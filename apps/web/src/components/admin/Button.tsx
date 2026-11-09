import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'secondary' | 'primary' | 'ok' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const variants: Record<Variant, string> = {
  secondary: 'border-admin-line bg-white hover:border-sand-400 hover:bg-sand-50',
  primary: 'border-terracotta-500 bg-terracotta-500 text-white hover:bg-terracotta-600',
  ok: 'border-admin-ok bg-admin-ok text-white hover:bg-admin-ok-dark',
  ghost: 'border-transparent bg-transparent hover:bg-sand-200/60',
  danger: 'border-admin-line bg-white text-admin-danger hover:border-admin-danger/40 hover:bg-[#fdf2ef]',
};
const sizes: Record<Size, string> = {
  md: 'rounded-[11px] px-[15px] py-[9px] text-[13.5px]',
  sm: 'rounded-[9px] px-[11px] py-[6px] text-[12.5px]',
};

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className);

interface Shared {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = 'button', ...props }: ComponentProps<'button'> & Shared) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

/** A navigation link that looks like a button. */
export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & Shared) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/** Square icon-only button (search, notifications, close). Always give it an aria-label. */
export function IconButton({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'relative grid h-10 w-10 flex-none place-items-center rounded-[10px] border border-admin-line bg-white transition hover:border-sand-400',
        className,
      )}
      {...props}
    />
  );
}
