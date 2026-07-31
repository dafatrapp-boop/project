import Link from 'next/link';
import { CalendarClock, Settings as SettingsIcon } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Table, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AddAppointmentButton } from './add-appointment-button';
import { AppointmentStatusSelect } from './status-select';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { APPOINTMENTS_GUIDE } from '@/lib/guide/content';
import type { AppointmentStatus } from '@/lib/appointments/constants';

interface AppointmentRow {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  appointment_date: string;
  start_time: string;
  status: AppointmentStatus;
  source: string;
}

export default async function AppointmentsPage() {
  const { supabase, workspaceId, user } = await requireWorkspace();

  const { data: settings } = await supabase
    .from('appointment_settings')
    .select('enabled')
    .eq('workspace_id', workspaceId)
    .single();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, customer_name, phone, email, appointment_date, start_time, status, source')
    .eq('workspace_id', workspaceId)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(150);

  const guideDismissed = await getGuideDismissed(supabase, user.id, 'appointments');

  const rows = (appointments ?? []) as AppointmentRow[];

  const columns: Column<AppointmentRow>[] = [
    { header: 'العميل', cell: (row) => row.customer_name },
    { header: 'الهاتف', cell: (row) => row.phone ?? '—' },
    {
      header: 'التاريخ والوقت',
      cell: (row) =>
        `${new Date(row.appointment_date).toLocaleDateString('ar-SA')} — ${row.start_time.slice(0, 5)}`,
    },
    {
      header: 'المصدر',
      cell: (row) => (
        <Badge tone={row.source === 'public_booking' ? 'brand' : 'neutral'}>
          {row.source === 'public_booking' ? 'حجز من الصفحة' : 'يدوي'}
        </Badge>
      ),
    },
    {
      header: 'الحالة',
      cell: (row) => <AppointmentStatusSelect id={row.id} status={row.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">المواعيد</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
            <Badge tone={settings?.enabled ? 'success' : 'neutral'}>
              {settings?.enabled ? 'الحجز مفعّل في صفحاتك' : 'الحجز معطّل حاليًا'}
            </Badge>
            <Link href="/settings" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
              <SettingsIcon size={14} /> تعديل الإعدادات
            </Link>
          </div>
        </div>
        <AddAppointmentButton />
      </div>

      <PageGuide
        guideKey="appointments"
        title={APPOINTMENTS_GUIDE.title}
        steps={APPOINTMENTS_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="لا توجد مواعيد بعد"
          description="أضف موعدًا يدويًا، أو فعّل الحجز من الإعدادات ليصل حجز العملاء تلقائيًا من صفحتك."
        />
      ) : (
        <Table columns={columns} rows={rows} keyField={(row) => row.id} />
      )}
    </div>
  );
}
