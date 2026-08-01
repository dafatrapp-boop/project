import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Phase 2 — new primitive. Standardizes the title+description+actions
 * row repeated (with slight drift) at the top of every page, and adds
 * a real breadcrumb slot (Phase 1 finding: no wayfinding pattern below
 * top-level nav). Not wired into pages yet — Phase 3/4 will replace
 * each page's hand-written header block with this.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-body-sm text-ink-muted">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronLeft size={14} className="icon-flip shrink-0 text-ink-faint" />}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-title-lg text-ink">{title}</h1>
          {description && <p className="mt-1 text-body text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
