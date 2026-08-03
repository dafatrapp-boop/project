'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/(dashboard)/notifications/actions';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON_TONE: Record<string, string> = {
  new_lead: 'bg-brand-500',
  new_campaign: 'bg-success',
  plan_expiring: 'bg-danger',
  reminder_lead_followup: 'bg-brand-500',
  reminder_call: 'bg-brand-500',
  reminder_callback: 'bg-brand-500',
  reminder_campaign: 'bg-success',
  reminder_meeting: 'bg-info',
  reminder_task: 'bg-info',
  reminder_sales_activity: 'bg-info',
  reminder_custom: 'bg-info',
  other: 'bg-ink-faint',
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface-subtle hover:text-ink"
        aria-label="الإشعارات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-ink">الإشعارات</span>
              {unreadCount > 0 && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => markAllNotificationsReadAction())}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-ink-faint">لا توجد إشعارات بعد.</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? '#'}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read_at) startTransition(() => markNotificationReadAction(n.id));
                    }}
                    className={`flex gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-subtle ${
                      !n.read_at ? 'bg-brand-50/40' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_ICON_TONE[n.type] ?? TYPE_ICON_TONE.other}`}
                    />
                    <div>
                      <p className="font-medium text-ink">{n.title}</p>
                      {n.body && <p className="text-xs text-ink-muted">{n.body}</p>}
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {new Date(n.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
