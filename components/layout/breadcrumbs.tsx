'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { buildBreadcrumbs } from '@/lib/navigation';

/**
 * Phase 3 — new. Answers the Phase 1 finding that detail pages had no
 * wayfinding below the top-level nav item ("just a single back link").
 * Derives the trail from the URL via lib/navigation.ts so it works for
 * every route today without any individual page needing to supply it;
 * Phase 4 can let a specific page override the last crumb with a real
 * record name once that page's content is redesigned.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="مسار التنقل" className="hidden items-center gap-1.5 text-body-sm sm:flex">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronLeft size={14} className="icon-flip shrink-0 text-ink-faint" />}
          {crumb.href ? (
            <Link href={crumb.href} className="text-ink-muted transition-colors hover:text-ink">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-ink">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
