'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  History,
  FileEdit,
  FileX,
  UserX,
  UserPlus,
  UserMinus,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export interface ActivityEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_label: string | null;
  created_at: string;
  actorName: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  landing_page_updated: 'عدّل صفحة الهبوط',
  landing_page_deleted: 'حذف صفحة الهبوط',
  lead_deleted: 'حذف عميلًا محتملًا',
  member_added: 'أضاف عضوًا للفريق',
  member_removed: 'أزال عضوًا من الفريق',
};

const ACTION_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  landing_page_updated: 'brand',
  landing_page_deleted: 'danger',
  lead_deleted: 'danger',
  member_added: 'success',
  member_removed: 'warning',
};

const ACTION_ICON: Record<string, LucideIcon> = {
  landing_page_updated: FileEdit,
  landing_page_deleted: FileX,
  lead_deleted: UserX,
  member_added: UserPlus,
  member_removed: UserMinus,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} ${mins === 1 ? 'دقيقة' : 'دقائق'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(iso).toLocaleDateString('ar-SA');
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'اليوم';
  if (sameDay(date, yesterday)) return 'أمس';
  return date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function ActivityLogList({ entries }: { entries: ActivityEntry[] }) {
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');

  const availableActions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))),
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (action && e.action !== action) return false;
      if (q) {
        const needle = q.toLowerCase();
        const matches =
          (e.entity_label ?? '').toLowerCase().includes(needle) ||
          (e.actorName ?? '').toLowerCase().includes(needle) ||
          (ACTION_LABELS[e.action] ?? e.action).toLowerCase().includes(needle);
        if (!matches) return false;
      }
      return true;
    });
  }, [entries, q, action]);

  // Visual grouping by day (Phase 4.4 objective) — a running log is
  // much easier to scan when "today" is visually separated from
  // "last week," instead of one undifferentiated list.
  const groups = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>();
    for (const entry of filtered) {
      const key = dayLabel(entry.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (entries.length === 0) {
    return (
      <EmptyState icon={History} title="لا يوجد نشاط مسجل بعد" description="ستظهر هنا كل التغييرات المهمة في مساحة عملك." />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعنصر أو المستخدم..." className="!ps-9" />
        </div>
        <div className="sm:w-56">
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">كل أنواع الأحداث</option>
            {availableActions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
            ))}
          </Select>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Search} title="لا توجد نتائج" description="جرّب كلمة بحث أو فلتر مختلف." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([label, items]) => (
            <div key={label}>
              <p className="mb-2 text-body-sm font-semibold text-ink-muted">{label}</p>
              <Card padding="none">
                <ul className="divide-y divide-border">
                  {items.map((e) => {
                    const Icon = ACTION_ICON[e.action] ?? History;
                    return (
                      <li key={e.id} className="flex items-center gap-3 p-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-ink-faint">
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={ACTION_TONE[e.action] ?? 'neutral'} size="sm">
                              {ACTION_LABELS[e.action] ?? e.action}
                            </Badge>
                            {e.entity_label && <span className="truncate text-body-sm text-ink">{e.entity_label}</span>}
                          </div>
                          {e.actorName && (
                            <span className="mt-1 flex items-center gap-1.5 text-caption text-ink-faint">
                              <Avatar name={e.actorName} size="sm" />
                              {e.actorName}
                            </span>
                          )}
                        </div>
                        <span
                          className="shrink-0 whitespace-nowrap text-caption text-ink-faint"
                          title={new Date(e.created_at).toLocaleString('ar-SA')}
                        >
                          {relativeTime(e.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
