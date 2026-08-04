import Link from 'next/link';
import { Settings as SettingsIcon } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { AddAppointmentButton } from './add-appointment-button';
import { AppointmentsList, type AppointmentRow } from './appointments-list';
import { PageGuide } from '@/components/guide/page-guide';
import { getGuideDismissed } from '@/lib/guide/state';
import { APPOINTMENTS_GUIDE } from '@/lib/guide/content';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, user } = await requireWorkspace();
  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const [{ data: settings }, { data: appointmentsRaw }, guideDismissed] = await Promise.all([
    supabase.from('appointment_settings').select('enabled').eq('workspace_id', workspaceId).single(),
    supabase
      .from('appointments')
      .select('id, customer_name, phone, email, appointment_date, start_time, status, source')
      .eq('workspace_id', workspaceId)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(from, to),
    getGuideDismissed(supabase, user.id, 'appointments'),
  ]);

  const { rows: appointments, hasMore } = splitPage(appointmentsRaw ?? [], DEFAULT_PAGE_SIZE);
  const rows = appointments as AppointmentRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المواعيد"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={settings?.enabled ? 'success' : 'neutral'} dot>
              {settings?.enabled ? 'الحجز مفعّل في صفحاتك' : 'الحجز معطّل حاليًا'}
            </Badge>
            <Link href="/settings" className="inline-flex items-center gap-1 text-body-sm text-brand-600 hover:underline">
              <SettingsIcon size={13} /> تعديل الإعدادات
            </Link>
          </span>
        }
        actions={<AddAppointmentButton />}
      />

      <PageGuide
        guideKey="appointments"
        title={APPOINTMENTS_GUIDE.title}
        steps={APPOINTMENTS_GUIDE.steps}
        initiallyDismissed={guideDismissed}
      />

      <AppointmentsList rows={rows} />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/appointments" />
    </div>
  );
}
