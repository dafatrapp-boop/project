'use client';

import { useMemo, useState } from 'react';
import { Search, Phone, MessageCircle, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { digitsOnly, whatsAppLink } from '@/lib/utils';
import { AppointmentStatusSelect } from './status-select';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_ORDER,
  type AppointmentStatus,
} from '@/lib/appointments/constants';

export interface AppointmentRow {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  appointment_date: string;
  start_time: string;
  status: AppointmentStatus;
  source: string;
}

/**
 * Phase 4.3 — re-evaluated the workflow, not just the visuals: the old
 * page was one flat table ordered by date with no separation between
 * "happening today," "coming up," and "already happened." Grouping by
 * date bucket surfaces what actually needs attention today without
 * scrolling past weeks of already-completed appointments first.
 */
export function AppointmentsList({ rows }: { rows: AppointmentRow[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | AppointmentStatus>('');
  const [showPast, setShowPast] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (q && !r.customer_name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, status]);

  const today = filtered.filter((r) => r.appointment_date === todayStr);
  const upcoming = filtered.filter((r) => r.appointment_date > todayStr);
  const past = filtered.filter((r) => r.appointment_date < todayStr);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="لا توجد مواعيد بعد"
        description="أضف موعدًا يدويًا، أو فعّل الحجز من الإعدادات ليصل حجز العملاء تلقائيًا من صفحتك."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم العميل..." className="!ps-9" />
        </div>
        <div className="sm:w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">كل الحالات</option>
            {APPOINTMENT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="لا توجد نتائج" description="جرّب كلمة بحث أو فلتر مختلف." />
      ) : (
        <>
          <AppointmentGroup title="اليوم" rows={today} highlight />
          <AppointmentGroup title="القادمة" rows={upcoming} />

          {past.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast((v) => !v)}
                className="mb-2 text-body-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                {showPast ? 'إخفاء المواعيد السابقة' : `عرض المواعيد السابقة (${past.length})`}
              </button>
              {showPast && <AppointmentGroup title="السابقة" rows={past} muted />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentGroup({
  title,
  rows,
  highlight,
  muted,
}: {
  title: string;
  rows: AppointmentRow[];
  highlight?: boolean;
  muted?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <Card tone={highlight ? 'elevated' : 'default'} padding="none" className={muted ? 'opacity-80' : undefined}>
      <div className="px-4 pt-4">
        <CardHeader title={title} action={<Badge tone="neutral" size="sm">{rows.length}</Badge>} />
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-ink">{row.customer_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted">
                <span>
                  {new Date(row.appointment_date).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' — '}
                  {row.start_time.slice(0, 5)}
                </span>
                <Badge tone={row.source === 'public_booking' ? 'brand' : 'neutral'} size="sm">
                  {row.source === 'public_booking' ? 'حجز من الصفحة' : 'يدوي'}
                </Badge>
                {row.phone && (
                  <span className="flex items-center gap-1">
                    <a href={`tel:${digitsOnly(row.phone)}`} aria-label={`اتصال بـ ${row.customer_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-brand-50 hover:text-brand-600">
                      <Phone size={12} />
                    </a>
                    <a href={whatsAppLink(row.phone)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${row.customer_name}`} className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-success-50 hover:text-success">
                      <MessageCircle size={12} />
                    </a>
                  </span>
                )}
              </div>
            </div>
            <div className="w-full sm:w-44">
              <AppointmentStatusSelect id={row.id} status={row.status} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
