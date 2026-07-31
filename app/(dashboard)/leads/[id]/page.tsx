import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_TONE } from '@/lib/leads/constants';
import { StatusSelect } from './status-select';
import { NoteForm } from './note-form';
import { FollowUpForm, CompleteFollowUpButton } from './follow-up-form';
import { TagEditor } from './tag-editor';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!lead) notFound();

  const [{ data: notes }, { data: activities }, { data: followUps }] = await Promise.all([
    supabase
      .from('lead_notes')
      .select('id, body, created_at')
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
  ]);

  const pendingFollowUps = (followUps ?? []).filter((f) => !f.completed_at);
  const pastFollowUps = (followUps ?? []).filter((f) => f.completed_at);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/leads" className="flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-ink">
        {/* chevron points "back" — mirrors correctly since icon-flip is applied in RTL */}
        <ChevronRight size={16} className="icon-flip" />
        العودة إلى العملاء المحتملين
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-ink">{lead.full_name}</h1>
          <p className="text-sm text-ink-muted">
            {lead.phone ?? 'لا يوجد رقم هاتف'} · {lead.email ?? 'لا يوجد بريد إلكتروني'}
          </p>
          <Badge tone={LEAD_STATUS_TONE[lead.status]} className="mt-2">
            {LEAD_STATUS_LABELS[lead.status]}
          </Badge>
          <div className="mt-3">
            {hasFeature(plan, 'tags') && <TagEditor leadId={lead.id} initialTags={lead.tags ?? []} />}
          </div>
        </div>
        <div className="w-full sm:w-56">
          <StatusSelect leadId={lead.id} status={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Notes */}
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">الملاحظات</h2>
          <NoteForm leadId={lead.id} />
          <div className="flex flex-col gap-3">
            {(notes ?? []).length === 0 && (
              <p className="text-sm text-ink-faint">لا توجد ملاحظات بعد.</p>
            )}
            {(notes ?? []).map((note) => (
              <div key={note.id} className="rounded-md bg-surface-subtle p-3 text-sm">
                <p className="text-ink">{note.body}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {new Date(note.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity timeline */}
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-ink">سجل النشاط</h2>
          <ol className="flex flex-col gap-3">
            {(activities ?? []).map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <p className="text-ink">{ACTIVITY_LABELS[activity.type] ?? activity.type}</p>
                  <p className="text-xs text-ink-faint">
                    {new Date(activity.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </li>
            ))}
            {(activities ?? []).length === 0 && (
              <p className="text-sm text-ink-faint">لا يوجد سجل نشاط بعد.</p>
            )}
          </ol>
        </section>
      </div>

      {/* Follow-ups */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-ink">المتابعات</h2>
        <FollowUpForm leadId={lead.id} />

        <div className="flex flex-col gap-2">
          {pendingFollowUps.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-md bg-surface-subtle p-3 text-sm">
              <div>
                <p className="text-ink">{new Date(f.due_at).toLocaleString('ar-SA')}</p>
                {f.note && <p className="text-xs text-ink-muted">{f.note}</p>}
              </div>
              <CompleteFollowUpButton followUpId={f.id} leadId={lead.id} />
            </div>
          ))}
          {pendingFollowUps.length === 0 && (
            <p className="text-sm text-ink-faint">لا توجد متابعات مجدولة.</p>
          )}
        </div>

        {pastFollowUps.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-muted">
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
      </section>
    </div>
  );
}
