import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';
import { NAV_GROUPS, NAV_WORKSPACE, type NavItem } from '@/lib/navigation';

/**
 * Mobile-only "more" hub. The bottom tab bar (components/layout/mobile-nav.tsx)
 * only has room for 4 tabs, so everything else that lives in the desktop
 * sidebar needs a second entry point on phones — this page is that entry
 * point. Auth + workspace membership are already enforced by
 * app/(dashboard)/layout.tsx, so requireWorkspace here just gives us the
 * workspace context, not a second auth gate.
 *
 * Phase 3: now reads from lib/navigation.ts (shared with Sidebar) instead
 * of a locally hard-coded, hand-synced item list — the drift risk called
 * out in the old comment here is gone. Grouped by the same feature areas
 * as the desktop sidebar, and Settings + Team & Billing collapse into the
 * single "Workspace" destination (which opens the new WorkspaceTabs strip).
 */
const DESCRIPTIONS: Record<string, string> = {
  '/leads': 'قائمة العملاء المحتملين ومتابعتهم',
  '/appointments': 'حجوزات ومواعيد العملاء',
  '/orders': 'متابعة طلبات العملاء',
  '/landing-pages': 'إنشاء وتعديل صفحات الهبوط',
  '/campaigns': 'حملاتك الإعلانية وأداؤها',
  '/testimonials': 'تقييمات وشهادات العملاء',
  '/automations': 'قواعد الرد التلقائي',
  '/analytics': 'تقارير الأداء والتحويل',
  '/activity': 'كل الإجراءات على مساحتك',
  '/settings': 'إعدادات المساحة، الفريق، والباقة',
};

export default async function MorePage() {
  const { supabase, workspaceId, industry } = await requireWorkspace();

  const { data: appointmentSettings } = await supabase
    .from('appointment_settings')
    .select('enabled')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const showAppointments = !!appointmentSettings?.enabled;
  const showOrders = ORDER_RELEVANT_INDUSTRIES.includes(
    industry as (typeof ORDER_RELEVANT_INDUSTRIES)[number]
  );

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.requires === 'appointments') return showAppointments;
      if (item.requires === 'orders') return showOrders;
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  function renderRow(item: NavItem, isLast: boolean) {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-subtle ${
          !isLast ? 'border-b border-border' : ''
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="flex-1">
          <span className="block text-body-sm font-medium text-ink">{item.label}</span>
          {DESCRIPTIONS[item.href] && (
            <span className="block text-caption text-ink-muted">{DESCRIPTIONS[item.href]}</span>
          )}
        </span>
        <ChevronLeft size={16} className="icon-flip shrink-0 text-ink-faint" />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title-lg text-ink">المزيد</h1>

      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <p className="px-1 text-micro uppercase tracking-wide text-ink-faint">{group.label}</p>
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
            {group.items.map((item, i) => renderRow(item, i === group.items.length - 1))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <p className="px-1 text-micro uppercase tracking-wide text-ink-faint">الحساب</p>
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-subtle">
          {renderRow(NAV_WORKSPACE, true)}
        </div>
      </div>
    </div>
  );
}
