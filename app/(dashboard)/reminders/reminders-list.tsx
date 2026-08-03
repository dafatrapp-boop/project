'use client';

import Link from 'next/link';
import { Bell, X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  REMINDER_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
  REMINDER_STATUS_TONE,
  type ReminderType,
  type ReminderStatus,
} from '@/lib/reminders/constants';
import { cancelReminderAction } from './actions';

export interface ReminderRow {
  id: string;
  title: string;
  description: string | null;
  reminder_type: ReminderType;
  scheduled_at: string;
  status: ReminderStatus;
  lead_id: string | null;
  leadName: string | null;
  campaign_id: string | null;
  task_id: string | null;
  last_error?: string | null;
}

function ReminderCard({ reminder, overdue }: { reminder: ReminderRow; overdue?: boolean }) {
  const time = new Date(reminder.scheduled_at).toLocaleString('ar-SA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const linkHref = reminder.lead_id
    ? `/leads/${reminder.lead_id}`
    : reminder.campaign_id
    ? `/campaigns/${reminder.campaign_id}`
    : reminder.task_id
    ? '/appointments'
    : null;

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={overdue ? 'mt-0.5 text-danger' : 'mt-0.5 text-ink-faint'}>
          <Bell size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-medium text-ink">{reminder.title}</p>
          {reminder.description && <p className="truncate text-caption text-ink-muted">{reminder.description}</p>}
          {reminder.status === 'failed' && reminder.last_error && (
            <p className="truncate text-caption text-danger" title={reminder.last_error}>
              فشل الإرسال: {reminder.last_error}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" size="sm">{REMINDER_TYPE_LABELS[reminder.reminder_type]}</Badge>
            <span className="text-caption text-ink-faint">{time}</span>
            {linkHref && (
              <Link href={linkHref} className="text-caption text-brand-600 underline">
                عرض
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={overdue ? 'danger' : REMINDER_STATUS_TONE[reminder.status]} size="sm">
          {overdue ? 'متأخر' : REMINDER_STATUS_LABELS[reminder.status]}
        </Badge>
        {reminder.status === 'pending' && (
          <form action={() => cancelReminderAction(reminder.id)}>
            <button
              type="submit"
              aria-label="إلغاء التذكير"
              className="rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-subtle hover:text-danger"
            >
              <X size={15} />
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

export function RemindersList({ upcoming, history }: { upcoming: ReminderRow[]; history: ReminderRow[] }) {
  const now = new Date();

  const overdue = upcoming.filter((r) => r.status === 'pending' && new Date(r.scheduled_at) < now);
  const dueSoon = upcoming.filter((r) => !overdue.includes(r));

  if (upcoming.length === 0 && history.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="لا توجد تذكيرات بعد"
        description="أنشئ تذكيرًا لمتابعة عميل، مكالمة، أو أي نشاط مبيعات — ستصلك إشعارات فورية حتى لو كان التطبيق مغلقًا."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {overdue.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-body-sm font-semibold text-danger">
            <Clock size={14} /> متأخرة ({overdue.length})
          </p>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border px-4">
            {overdue.map((r) => (
              <ReminderCard key={r.id} reminder={r} overdue />
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-body-sm font-semibold text-ink">القادمة</p>
        {dueSoon.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-body-sm text-ink-faint">
            لا توجد تذكيرات قادمة.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border px-4">
            {dueSoon.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <p className="mb-1.5 text-body-sm font-semibold text-ink">السجل الأخير</p>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border px-4">
            {history.map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
