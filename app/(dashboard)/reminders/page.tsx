import { requireWorkspace } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { ReminderFormModal } from './reminder-form-modal';
import { RemindersList, type ReminderRow } from './reminders-list';
import type { ReminderType, ReminderStatus } from '@/lib/reminders/constants';

const ERROR_MESSAGES: Record<string, string> = {
  missing_title: 'يرجى إدخال عنوان للتذكير.',
  invalid_type: 'نوع التذكير غير صالح.',
  invalid_time: 'وقت غير صالح.',
  time_in_past: 'لا يمكن جدولة تذكير في الماضي.',
  create_failed: 'تعذر حفظ التذكير. حاول مرة أخرى.',
};

interface ReminderQueryRow {
  id: string;
  title: string;
  description: string | null;
  reminder_type: ReminderType;
  scheduled_at: string;
  status: ReminderStatus;
  lead_id: string | null;
  task_id: string | null;
  campaign_id: string | null;
  last_error: string | null;
  leads: { full_name: string } | { full_name: string }[] | null;
}

function toRow(r: ReminderQueryRow): ReminderRow {
  const leadRaw = r.leads;
  const lead = Array.isArray(leadRaw) ? leadRaw[0] ?? null : leadRaw;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    reminder_type: r.reminder_type,
    scheduled_at: r.scheduled_at,
    status: r.status,
    lead_id: r.lead_id,
    leadName: lead?.full_name ?? null,
    campaign_id: r.campaign_id,
    task_id: r.task_id,
    last_error: r.last_error,
  };
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const { supabase, workspaceId } = await requireWorkspace();

  const selectColumns = 'id, title, description, reminder_type, scheduled_at, status, lead_id, task_id, campaign_id, last_error, leads(full_name)';

  const [{ data: upcomingRaw }, { data: historyRaw }] = await Promise.all([
    supabase
      .from('reminders')
      .select(selectColumns)
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'processing'])
      .order('scheduled_at', { ascending: true })
      .limit(200),
    supabase
      .from('reminders')
      .select(selectColumns)
      .eq('workspace_id', workspaceId)
      .in('status', ['sent', 'failed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const upcoming = ((upcomingRaw ?? []) as unknown as ReminderQueryRow[]).map(toRow);
  const history = ((historyRaw ?? []) as unknown as ReminderQueryRow[]).map(toRow);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التذكيرات"
        description="تذكيرات مجدولة تصلك كإشعار فوري في وقتها، حتى لو كان التطبيق مغلقًا."
        actions={<ReminderFormModal />}
      />

      {searchParams.error && (
        <div className="max-w-2xl rounded-md border border-danger/30 bg-danger-50 px-3 py-2 text-body-sm text-danger">
          {ERROR_MESSAGES[searchParams.error] ?? 'حدث خطأ. حاول مرة أخرى.'}
        </div>
      )}
      {searchParams.success && (
        <div className="max-w-2xl rounded-md border border-success/30 bg-success-50 px-3 py-2 text-body-sm text-success">
          تم إنشاء التذكير بنجاح.
        </div>
      )}

      <RemindersList upcoming={upcoming} history={history} />
    </div>
  );
}
