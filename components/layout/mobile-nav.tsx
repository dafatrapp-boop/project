'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_OVERVIEW, NAV_GROUPS } from '@/lib/navigation';

// Curated subset of the full nav (see lib/navigation.ts) — a phone
// only has room for ~4 destinations plus an overflow. Everything else
// (landing pages, team/billing, appointments, orders, testimonials,
// automations, activity log, settings) lives behind "More" (see
// app/(dashboard)/more/page.tsx, which reads the same shared config).
const leadsItem = NAV_GROUPS[0].items[0]; // العملاء المحتملون
const campaignsItem = NAV_GROUPS[1].items[1]; // الحملات
const analyticsItem = NAV_GROUPS[2].items[0]; // التحليلات

const ITEMS = [NAV_OVERVIEW, leadsItem, campaignsItem, analyticsItem];

/**
 * Bottom tab bar shown only on mobile (< md). Uses large touch targets
 * (min 44px) and safe-area padding for iOS devices with a home indicator.
 * Phase 3: sources its items from lib/navigation.ts instead of a
 * locally duplicated list, and gains a raised-surface treatment
 * consistent with the rest of the Phase 2/3 elevation system.
 */
export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface-overlay pb-[env(safe-area-inset-bottom)] shadow-overlay md:hidden"
      aria-label="التنقل الرئيسي"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-micro font-medium transition-colors',
              active ? 'text-brand-600' : 'text-ink-faint'
            )}
          >
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-500" aria-hidden />}
            <Icon size={20} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
      <Link
        href="/more"
        className={cn(
          'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-micro font-medium transition-colors',
          pathname.startsWith('/more') ? 'text-brand-600' : 'text-ink-faint'
        )}
      >
        {pathname.startsWith('/more') && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-500" aria-hidden />}
        <MoreHorizontal size={20} strokeWidth={2} />
        المزيد
      </Link>
    </nav>
  );
}
