'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Megaphone, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/leads', label: 'العملاء', icon: Users },
  { href: '/campaigns', label: 'الحملات', icon: Megaphone },
  { href: '/analytics', label: 'التحليلات', icon: BarChart3 },
  // Everything else that lives in the desktop sidebar (landing pages,
  // team/plan & billing, appointments, orders, testimonials,
  // automations, activity log, settings) has no other entry point on
  // mobile — without this tab those pages are simply unreachable on
  // a phone. See /more.
  { href: '/more', label: 'المزيد', icon: MoreHorizontal },
];

/**
 * Bottom tab bar shown only on mobile (< md). Uses large touch targets
 * (min 44px) and safe-area padding for iOS devices with a home indicator.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="التنقل الرئيسي"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium',
              active ? 'text-brand-600' : 'text-ink-faint'
            )}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
