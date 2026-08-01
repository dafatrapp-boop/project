'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { WORKSPACE_TABS } from '@/lib/navigation';

/**
 * Phase 3 — implements the approved "merge Settings + Team & Billing
 * into one Workspace section with tabs" decision.
 *
 * Deliberately implemented as a navigation strip between two *separate*
 * routes (/settings, /team) rather than moving their file contents into
 * one route with client-side tab-switching. Both pages do independent
 * server-side data fetching (workspace profile vs. members/billing/
 * usage) tied to their own actions.ts files; merging the files
 * themselves would mean rewiring server actions, revalidatePath calls,
 * and every existing link to /settings or /team across the app
 * (onboarding checklist, appointments empty-state link, landing-page
 * editor help link) — real routing/business-logic surface area that's
 * explicitly out of scope for a shell-only phase. This gets users the
 * "one section, tabs" experience today at zero risk; collapsing the
 * routes for real is a safe, isolated follow-up if wanted later.
 */
export function WorkspaceTabs() {
  const pathname = usePathname();

  return (
    <div role="tablist" className="mb-6 inline-flex gap-1 rounded-lg bg-surface-sunken p-1">
      {WORKSPACE_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'flex items-center gap-2 rounded-md px-3.5 py-1.5 text-body-sm font-medium transition-all duration-fast ease-out',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
              active ? 'bg-surface text-ink shadow-subtle' : 'text-ink-muted hover:text-ink'
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
