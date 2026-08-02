import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center';
}

export function AuthCard({ title, description, children, className, align = 'start' }: AuthCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-7 shadow-elevated sm:p-9',
        align === 'center' && 'text-center',
        className
      )}
    >
      {title && (
        <h1 className="mb-1.5 text-title-lg text-ink">{title}</h1>
      )}
      {description && <p className="mb-7 text-body-lg leading-relaxed text-ink-muted">{description}</p>}
      {title && !description && <div className="mb-7" />}
      {children}
    </div>
  );
}
