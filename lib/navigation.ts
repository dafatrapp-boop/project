import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  BarChart3,
  History,
  CalendarClock,
  ShoppingBag,
  MessageSquareQuote,
  Zap,
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react';

/**
 * Phase 3 — single source of truth for the app's navigation.
 *
 * Previously the sidebar and the mobile "More" page each hard-coded
 * their own copy of this list with a comment asking future editors to
 * keep them in sync by hand (see git history on components/layout/
 * sidebar.tsx and app/(dashboard)/more/page.tsx). That's exactly the
 * kind of drift a shared config prevents. Sidebar, MobileNav, MorePage,
 * and Breadcrumbs all read from this file now.
 *
 * IMPORTANT: this file only changes how navigation is *presented* —
 * every href below is a route that already existed before Phase 3.
 * No route was renamed or moved.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only relevant to conditional items (Appointments/Orders). */
  requires?: 'appointments' | 'orders';
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Always visible, not part of a group — the single "home" destination. */
export const NAV_OVERVIEW: NavItem = {
  href: '/dashboard',
  label: 'نظرة عامة',
  icon: LayoutDashboard,
};

/**
 * Feature-grouped nav (Phase 1 finding: the old sidebar was one flat
 * 12-item list with no visual grouping). Three groups map to how a
 * merchant actually thinks about the product: working leads day to
 * day, running marketing, and checking numbers.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'sales',
    label: 'المبيعات والعملاء',
    items: [
      { href: '/leads', label: 'العملاء المحتملون', icon: Users },
      { href: '/reminders', label: 'التذكيرات', icon: Bell },
      { href: '/appointments', label: 'المواعيد', icon: CalendarClock, requires: 'appointments' },
      { href: '/orders', label: 'الطلبات', icon: ShoppingBag, requires: 'orders' },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق والصفحات',
    items: [
      { href: '/landing-pages', label: 'صفحات الهبوط', icon: FileText },
      { href: '/campaigns', label: 'الحملات', icon: Megaphone },
      { href: '/testimonials', label: 'آراء العملاء', icon: MessageSquareQuote },
      { href: '/automations', label: 'الأتمتة', icon: Zap },
    ],
  },
  {
    id: 'insights',
    label: 'التحليلات والنشاط',
    items: [
      { href: '/analytics', label: 'التحليلات', icon: BarChart3 },
      { href: '/activity', label: 'سجل النشاط', icon: History },
    ],
  },
];

/**
 * Workspace area — merges what were two separate sidebar items
 * (Settings, Team & Billing) into one nav destination per Phase 3
 * decision. The two underlying routes (/settings, /team) are
 * untouched; a WorkspaceTabs strip (components/layout/workspace-tabs.tsx)
 * switches between them so they read as one section with tabs.
 */
export const NAV_WORKSPACE: NavItem = {
  href: '/settings',
  label: 'مساحة العمل',
  icon: Settings,
};

export const WORKSPACE_TABS: NavItem[] = [
  { href: '/settings', label: 'الإعدادات', icon: Settings },
  { href: '/team', label: 'الفريق والباقة', icon: Users },
];

/** Flat list of every item above, used for active-state / breadcrumb matching. */
export function allNavItems(): NavItem[] {
  return [NAV_OVERVIEW, ...NAV_GROUPS.flatMap((g) => g.items), ...WORKSPACE_TABS];
}

/** Static labels for known second-level route segments (list/new/edit/etc). */
const SUBROUTE_LABELS: Record<string, string> = {
  pipeline: 'خط الأنابيب',
  import: 'استيراد',
  new: 'إنشاء',
  edit: 'تعديل',
};

const UUID_RE = /^[0-9a-f-]{20,}$/i;

/**
 * Builds a breadcrumb trail from a pathname using the nav config above
 * plus a small static dictionary for known sub-routes. Dynamic segments
 * (a lead ID, a campaign ID) resolve to a generic "التفاصيل" crumb
 * rather than the record's real name — the shell has no page-level data
 * to draw from yet (Phase 4 will let individual pages override this
 * with their real title once page content itself is redesigned).
 */
export function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [];

  const root = `/${segments[0]}`;
  const match = allNavItems().find((item) => item.href === root);
  if (!match) return [];

  const crumbs: { label: string; href?: string }[] = [
    { label: match.label, href: segments.length > 1 ? root : undefined },
  ];

  if (segments.length > 1) {
    const second = segments[1];
    const label = UUID_RE.test(second) ? 'التفاصيل' : SUBROUTE_LABELS[second] ?? second;
    const hasMore = segments.length > 2;
    crumbs.push({ label, href: hasMore ? `${root}/${second}` : undefined });
  }

  if (segments.length > 2) {
    const third = segments[2];
    const label = UUID_RE.test(third) ? 'التفاصيل' : SUBROUTE_LABELS[third] ?? third;
    crumbs.push({ label });
  }

  return crumbs;
}
