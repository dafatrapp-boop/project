'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import {
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_ORDER,
  REMINDER_PRESETS,
  toDatetimeLocalValue,
  type ReminderType,
} from '@/lib/reminders/constants';
import { createReminderAction } from './actions';

interface ReminderFormModalProps {
  /** Pre-links the reminder to a lead (e.g. opened from the lead detail page). */
  leadId?: string;
  leadName?: string;
  triggerLabel?: string;
}

export function ReminderFormModal({ leadId, leadName, triggerLabel }: ReminderFormModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(leadName ? `الاتصال بـ ${leadName}` : '');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>(leadId ? 'lead_followup' : 'custom');
  const [localDateTime, setLocalDateTime] = useState('');
  // Computed client-only after mount to avoid an SSR/client hydration
  // mismatch — the <dialog> markup exists in the DOM even while closed,
  // so any server-rendered value here would differ from the browser's
  // real timezone the instant this mounts.
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!localDateTime) {
      const soon = new Date(Date.now() + 60 * 60 * 1000); // default: 1 hour from now
      setLocalDateTime(toDatetimeLocalValue(soon));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduledAtIso = useMemo(() => {
    if (!localDateTime) return '';
    const d = new Date(localDateTime); // parsed as browser-local time
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }, [localDateTime]);

  function applyPreset(resolve: (now: Date) => Date) {
    setLocalDateTime(toDatetimeLocalValue(resolve(new Date())));
  }

  const previewTime = useMemo(() => {
    if (!localDateTime) return null;
    const d = new Date(localDateTime);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('ar-SA', { weekday: 'long', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'long' });
  }, [localDateTime]);

  return (
    <>
      <Button onClick={() => setOpen(true)} size={triggerLabel ? 'sm' : undefined} variant={leadId ? 'secondary' : undefined}>
        {leadId ? <Bell size={15} /> : <Plus size={16} />}
        {triggerLabel ?? 'تذكير جديد'}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء تذكير">
        <form action={createReminderAction} className="flex flex-col gap-4">
          {leadId && <input type="hidden" name="leadId" value={leadId} />}
          <input type="hidden" name="scheduledAtIso" value={scheduledAtIso} />
          <input type="hidden" name="timezone" value={timezone} />

          <Select
            name="reminderType"
            label="نوع التذكير"
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value as ReminderType)}
          >
            {REMINDER_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {REMINDER_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>

          <Input
            name="title"
            label="العنوان"
            placeholder="مثال: الاتصال بأحمد السيد"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            name="description"
            label="تفاصيل إضافية (اختياري)"
            placeholder="مثال: متابعة بخصوص نقاش الأسعار"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <p className="mb-1.5 text-body-sm font-medium text-ink">الوقت</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.resolve)}
                  className="rounded-md border border-border px-2.5 py-1 text-caption font-medium text-ink-muted transition-colors hover:border-brand-500 hover:text-brand-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <Input
              type="datetime-local"
              value={localDateTime}
              onChange={(e) => setLocalDateTime(e.target.value)}
              required
            />
          </div>

          {/* Live preview — exactly what the push notification will say,
              so there's never a surprise between "what I typed" and
              "what the customer's rep will see on their lock screen". */}
          <div className="rounded-md border border-border bg-surface-subtle px-3 py-2.5">
            <p className="mb-1 text-micro font-semibold uppercase tracking-wide text-ink-faint">معاينة الإشعار</p>
            <p className="text-body-sm font-medium text-ink">{title || 'العنوان سيظهر هنا'}</p>
            {description && <p className="text-caption text-ink-muted">{description}</p>}
            {previewTime && <p className="mt-1 text-caption text-brand-600">سيصلك تذكير يوم {previewTime}</p>}
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={!scheduledAtIso}>
              حفظ التذكير
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
