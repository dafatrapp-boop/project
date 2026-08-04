import { notFound } from 'next/navigation';
import { Phone, MessageCircle, Mail, StickyNote, History, CalendarClock, Paperclip } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ACTIVITY_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_TONE } from '@/lib/leads/constants';

const NOTE_TYPE_LABELS: Record<string, string> = {
  call: 'مكالمة',
  meeting: 'اجتماع',
  email: 'بريد إلكتروني',
  whatsapp: 'واتساب',
};
import { digitsOnly, whatsAppLink } from '@/lib/utils';
import { StatusSelect } from './status-select';
import { NoteForm } from './note-form';
import { FollowUpForm, CompleteFollowUpButton } from './follow-up-form';
import { TagEditor } from './tag-editor';
import { ValueEditor } from './value-editor';
import { CustomFieldsEditor } from './custom-fields-editor';
import { AttachmentsList } from './attachments-list';
import { AiSuggestionButton } from './ai-suggestion-button';
import { ReminderFormModal } from '@/app/(dashboard)/reminders/reminder-form-modal';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!lead) notFound();

  const [{ data: notes }, { data: activities }, { data: followUps }, { data: customFieldDefs }] = await Promise.all([
    supabase
      .from('lead_notes')
      .select('id, body, note_type, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('lead_activities')
      .select('id, type, payload, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('lead_follow_ups')
      .select('id, due_at, note, completed_at')
      .eq('lead_id', lead.id)
      .order('due_at', { ascending: true }),
    supabase
      .from('custom_field_definitions')
      .select('id, key, label, field_type, options')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true }),
  ]);

  const { data: attachments } = await supabase
    .from('lead_attachments')
    .select('id, file_path, file_name, file_size, created_at')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false });

  const pendingFollowUps = (followUps ?? []).filter((f) => !f.completed_at);
  const pastFollowUps = (followUps ?? []).filter((f) => f.completed_at);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Profile header — the previous manual "back to leads" link was
          removed here since the Phase 3 breadcrumb bar in the header
          now provides that wayfinding on every page, so keeping both
          was redundant. */}
      <Card>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <Avatar name={lead.full_name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-title-lg text-ink">{lead.full_name}</h1>
                <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
              </div>

              {/* Quick contact actions — the single most important gap
                  found in Phase 1: phone/email were plain unclickable
                  text, requiring a manual copy-paste to actually reach
                  a lead. */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {lead.phone ? (
                  <>
                    <a
                      href={`tel:${digitsOnly(lead.phone)}`}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-body-sm font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Phone size={14} />
                      {lead.phone}
                    </a>
                    <a
                      href={whatsAppLink(lead.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="تواصل عبر واتساب"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-ink-faint transition-colors hover:border-success/30 hover:bg-success-50 hover:text-success"
                    >
                      <MessageCircle size={15} />
                    </a>
                  </>
                ) : (
                  <span className="text-body-sm text-ink-faint">لا يوجد رقم هاتف</span>
                )}
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-body-sm font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Mail size={14} />
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-body-sm text-ink-faint">لا يوجد بريد إلكتروني</span>
                )}
              </div>

              <div className="mt-3">
                <ValueEditor leadId={lead.id} initialValue={lead.estimated_value} />
              </div>

              {hasFeature(plan, 'tags') && (
                <div className="mt-3">
                  <TagEditor leadId={lead.id} initialTags={lead.tags ?? []} />
                </div>
              )}
            </div>
          </div>
          <div className="w-full sm:w-56">
            <StatusSelect leadId={lead.id} status={lead.status} />
          </div>
        </div>
      </Card>

      {(customFieldDefs ?? []).length > 0 && (
        <Card>
          <CardHeader title="حقول إضافية" />
          <CustomFieldsEditor
            leadId={lead.id}
            fields={customFieldDefs ?? []}
            initialValues={(lead.custom_fields ?? {}) as Record<string, string>}
          />
        </Card>
      )}

      {/* Follow-ups — moved above Notes/Activity: scheduling and
          completing the next touch-point is the highest-frequency
          action a salesperson takes on this page. */}
      <Card>
        <CardHeader
          title="المتابعات"
          action={<ReminderFormModal leadId={lead.id} leadName={lead.full_name} triggerLabel="تذكير فوري" />}
        />
        <FollowUpForm leadId={lead.id} />

        <div className="mt-3">
          <AiSuggestionButton leadId={lead.id} phone={lead.phone} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {pendingFollowUps.map((f) => {
            const due = new Date(f.due_at);
            const overdue = due < new Date();
            const dueToday = !overdue && due < new Date(todayStart.getTime() + 86400000);
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-medium text-ink">{due.toLocaleString('ar-SA')}</p>
                    {(overdue || dueToday) && (
                      <Badge tone={overdue ? 'danger' : 'warning'} size="sm">
                        {overdue ? 'متأخر' : 'اليوم'}
                      </Badge>
                    )}
                  </div>
                  {f.note && <p className="mt-0.5 truncate text-caption text-ink-muted">{f.note}</p>}
                </div>
                <CompleteFollowUpButton followUpId={f.id} leadId={lead.id} />
              </div>
            );
          })}
          {pendingFollowUps.length === 0 && (
            <p className="text-body-sm text-ink-faint">لا توجد متابعات مجدولة.</p>
          )}
        </div>

        {pastFollowUps.length > 0 && (
          <details className="mt-3 text-body-sm">
            <summary className="cursor-pointer select-none text-ink-muted transition-colors hover:text-ink">
              المتابعات المكتملة ({pastFollowUps.length})
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {pastFollowUps.map((f) => (
                <div key={f.id} className="rounded-md bg-surface-subtle p-3 text-ink-muted">
                  {new Date(f.due_at).toLocaleString('ar-SA')} {f.note ? `— ${f.note}` : ''}
                </div>
              ))}
            </div>
          </details>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notes */}
        <Card>
          <CardHeader title="الملاحظات" action={<StickyNote size={16} className="text-ink-faint" />} />
          <NoteForm leadId={lead.id} />
          <div className="mt-4 flex flex-col gap-3">
            {(notes ?? []).length === 0 && (
              <p className="text-body-sm text-ink-faint">لا توجد ملاحظات بعد.</p>
            )}
            {(notes ?? []).map((note) => (
              <div key={note.id} className="rounded-md bg-surface-subtle p-3">
                <p className="text-body-sm text-ink">{note.body}</p>
                <div className="mt-1 flex items-center gap-2">
                  {note.note_type !== 'general' && (
                    <Badge tone="neutral" size="sm">{NOTE_TYPE_LABELS[note.note_type] ?? note.note_type}</Badge>
                  )}
                  <p className="text-caption text-ink-faint">
                    {new Date(note.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity timeline */}
        <Card>
          <CardHeader title="سجل النشاط" action={<History size={16} className="text-ink-faint" />} />
          {(activities ?? []).length === 0 ? (
            <p className="text-body-sm text-ink-faint">لا يوجد سجل نشاط بعد.</p>
          ) : (
            <ol className="relative flex flex-col gap-4 ps-1">
              {/* connecting line */}
              <span className="absolute bottom-1 start-[7px] top-1 w-px bg-border" aria-hidden />
              {(activities ?? []).map((activity) => (
                <li key={activity.id} className="relative flex items-start gap-3 ps-5">
                  <span className="absolute start-0 top-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-surface bg-brand-500" />
                  <div className="min-w-0">
                    <p className="text-body-sm text-ink">{ACTIVITY_LABELS[activity.type] ?? activity.type}</p>
                    <p className="text-caption text-ink-faint">
                      {new Date(activity.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="المرفقات" action={<Paperclip size={16} className="text-ink-faint" />} />
        <AttachmentsList leadId={lead.id} workspaceId={workspaceId} initialAttachments={attachments ?? []} />
      </Card>
    </div>
  );
}
