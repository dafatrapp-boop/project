'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  BarChart3,
  UsersRound,
  History,
  Settings,
  CalendarClock,
  ShoppingBag,
  MessageSquareQuote,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  showAppointments: boolean;
  showOrders: boolean;
}

/**
 * Primary desktop/tablet sidebar. On mobile this is replaced by the
 * bottom navigation bar (see components/layout/mobile-nav.tsx) — this
 * component hides itself below the `md` breakpoint.
 *
 * Appointments/Orders only show up for the industries they're
 * actually useful for (see requireWorkspace + the layout that renders
 * this); Testimonials and Automations are useful for every business
 * type so they're always shown.
 */
export function Sidebar({ showAppointments, showOrders }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
    { href: '/leads', label: 'العملاء المحتملون', icon: Users },
    { href: '/landing-pages', label: 'صفحات الهبوط', icon: FileText },
    { href: '/campaigns', label: 'الحملات', icon: Megaphone },
    ...(showAppointments ? [{ href: '/appointments', label: 'المواعيد', icon: CalendarClock }] : []),
    ...(showOrders ? [{ href: '/orders', label: 'الطلبات', icon: ShoppingBag }] : []),
    { href: '/testimonials', label: 'آراء العملاء', icon: MessageSquareQuote },
    { href: '/automations', label: 'الأتمتة', icon: Zap },
    { href: '/analytics', label: 'التحليلات', icon: BarChart3 },
    { href: '/team', label: 'الفريق والباقة', icon: UsersRound },
    { href: '/activity', label: 'سجل النشاط', icon: History },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-e border-border bg-surface md:flex md:flex-col">
      <div className="flex h-14 items-center px-5">
        <span className="text-base font-semibold text-ink">SocialSales OS</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-muted hover:bg-surface-subtle hover:text-ink'
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
