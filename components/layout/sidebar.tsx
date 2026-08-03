'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsRight, MessageCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_OVERVIEW, NAV_GROUPS, NAV_WORKSPACE } from '@/lib/navigation';
import { LogoutButton } from './logout-button';

interface SidebarProps {
  showAppointments: boolean;
  showOrders: boolean;
  workspaceName: string;
}

/**
 * Primary desktop/tablet sidebar. On mobile this is replaced by the
 * bottom navigation bar (see components/layout/mobile-nav.tsx) — this
 * component hides itself below the `md` breakpoint.
 *
 * Phase 3 changes:
 * - Reads from lib/navigation.ts (shared with MobileNav/MorePage/
 *   Breadcrumbs) instead of a locally hard-coded item list.
 * - Items are grouped by feature area (Sales & Leads / Marketing /
 *   Insights) with section labels, instead of one flat 12-item list.
 * - Settings + Team & Billing are now a single "Workspace" entry.
 * - Collapsible to an icon rail (persisted in localStorage) — a
 *   common premium-SaaS affordance (Linear, Notion) that costs no
 *   navigation depth since labels reappear as tooltips.
 * - Shows the actual workspace name, not just the product logo, so
 *   multi-tenant users always see which business they're acting in.
 */
export function Sidebar({ showAppointments, showOrders, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ss-sidebar-collapsed');
    if (stored === '1') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ss-sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-base ease-out md:flex',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Brand + workspace identity */}
      <div className={cn('flex h-14 items-center gap-2.5 border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white">
          <MessageCircle size={15} strokeWidth={2.5} />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-body-sm font-semibold leading-tight text-ink">{workspaceName || 'SocialSales OS'}</p>
            <p className="text-micro font-normal text-ink-faint">SocialSales OS</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        <NavLink item={NAV_OVERVIEW} active={isActive(NAV_OVERVIEW.href)} collapsed={collapsed} />

        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.requires === 'appointments') return showAppointments;
            if (item.requires === 'orders') return showOrders;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.id} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-2.5 pb-1 text-micro uppercase tracking-wide text-ink-faint">{group.label}</p>
              )}
              {visibleItems.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Workspace (merged Settings + Team & Billing) — pinned above the collapse toggle */}
      <div className="border-t border-border px-3 py-3">
        <NavLink
          item={NAV_WORKSPACE}
          active={pathname.startsWith('/settings') || pathname.startsWith('/team')}
          collapsed={collapsed}
        />
        <LogoutButton collapsed={collapsed} />
        <button
          onClick={toggleCollapsed}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-body-sm font-medium text-ink-faint transition-colors hover:bg-surface-subtle hover:text-ink',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
            collapsed && 'justify-center'
          )}
          aria-label={collapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        >
          <ChevronsRight size={17} className={cn('icon-flip shrink-0 transition-transform duration-base', collapsed && 'rotate-180')} />
          {!collapsed && 'طي القائمة'}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, active, collapsed }: { item: { href: string; label: string; icon: LucideIcon }; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-body-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20',
        collapsed && 'justify-center px-0',
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-subtle hover:text-ink'
      )}
    >
      {active && !collapsed && (
        <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-brand-500" aria-hidden />
      )}
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      {!collapsed && item.label}
    </Link>
  );
}
