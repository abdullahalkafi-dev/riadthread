import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-card border border-admin-line bg-admin-surface shadow-card', className)} {...props} />;
}

interface CardHeaderProps {
  title: React.ReactNode;
  /** Right-hand side: a link, a count, a button. */
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2.5 px-[18px] pt-4', className)}>
      <h3 className="font-display text-lg font-normal">{title}</h3>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-[18px] pb-[18px] pt-4', className)} {...props} />;
}
