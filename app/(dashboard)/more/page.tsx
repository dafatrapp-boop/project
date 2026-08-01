import Link from 'next/link';
import {
  FileText,
  CalendarClock,
  ShoppingBag,
  MessageSquareQuote,
  Zap,
  CreditCard,
  History,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';

/**
 * Mobile-only "more" hub. The bottom tab bar (components/layout/mobile-nav.tsx)
 * only has room for 4 tabs, so everything else that lives in the desktop
 * sidebar (components/layout/sidebar.tsx) needs a second entry point on
 * phones — this page is that entry point. Keep this list in sync with
 * Sidebar's navItems. Auth + workspace membership are already enforced
 * by app/(dashboard)/layout.tsx, so requireWorkspace here just gives us
 * the workspace context, not a second auth gate.
 */
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

  const items = [
    { href: '/landing-pages', label: 'صفحات الهبوط', desc: 'إنشاء وتعديل صفحات الهبوط', icon: FileText },
    ...(showAppointments
      ? [{ href: '/appointments', label: 'المواعيد', desc: 'حجوزات ومواعيد العملاء', icon: CalendarClock }]
      : []),
    ...(showOrders
      ? [{ href: '/orders', label: 'الطلبات', desc: 'متابعة طلبات العملاء', icon: ShoppingBag }]
      : []),
    { href: '/testimonials', label: 'آراء العملاء', desc: 'تقييمات وشهادات', icon: MessageSquareQuote },
    { href: '/automations', label: 'الأتمتة', desc: 'قواعد الرد التلقائي', icon: Zap },
    { href: '/team', label: 'الاشتراكات والباقة', desc: 'الفريق، الباقة الحالية، والفوترة', icon: CreditCard },
    { href: '/activity', label: 'سجل النشاط', desc: 'كل الإجراءات على مساحتك', icon: History },
    { href: '/settings', label: 'الإعدادات', desc: 'إعدادات المساحة والحساب', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">المزيد</h1>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
        {items.map(({ href, label, desc, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-subtle ${
              i !== items.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon size={18} strokeWidth={2} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-ink">{label}</span>
              <span className="block text-xs text-ink-muted">{desc}</span>
            </span>
            <ChevronLeft size={16} className="icon-flip shrink-0 text-ink-faint" />
          </Link>
        ))}
      </div>
    </div>
  );
}
