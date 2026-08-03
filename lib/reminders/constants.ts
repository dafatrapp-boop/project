export type ReminderType =
  | 'lead_followup'
  | 'call'
  | 'meeting'
  | 'task'
  | 'callback'
  | 'campaign'
  | 'sales_activity'
  | 'custom';

export type ReminderStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  lead_followup: 'متابعة عميل محتمل',
  call: 'مكالمة',
  meeting: 'اجتماع',
  task: 'مهمة',
  callback: 'اتصال عودة بعميل',
  campaign: 'حملة',
  sales_activity: 'نشاط مبيعات',
  custom: 'تذكير مخصص',
};

export const REMINDER_TYPE_ORDER: ReminderType[] = [
  'lead_followup',
  'call',
  'meeting',
  'callback',
  'task',
  'sales_activity',
  'campaign',
  'custom',
];

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'قادم',
  processing: 'جارٍ الإرسال',
  sent: 'تم الإرسال',
  failed: 'فشل',
  cancelled: 'ملغى',
};

export const REMINDER_STATUS_TONE: Record<ReminderStatus, 'brand' | 'success' | 'danger' | 'neutral' | 'warning'> = {
  pending: 'brand',
  processing: 'warning',
  sent: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

export interface ReminderPreset {
  id: string;
  label: string;
  /** Given "now" (captured at click time), returns the target Date in the browser's local time. */
  resolve: (now: Date) => Date;
}

// Every preset resolves in the BROWSER, using the device's own local
// time — the same moment a user reads "8 صباحًا غدًا" on their screen
// is the moment stored, converted to UTC client-side before it ever
// reaches the server. This is what makes "next week" mean the same
// wall-clock time regardless of which timezone a workspace's members
// are actually in.
export const REMINDER_PRESETS: ReminderPreset[] = [
  {
    id: 'in_2_hours',
    label: 'بعد ساعتين',
    resolve: (now) => new Date(now.getTime() + 2 * 60 * 60 * 1000),
  },
  {
    id: 'tomorrow_morning',
    label: 'غدًا صباحًا',
    resolve: (now) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    id: 'next_week',
    label: 'الأسبوع القادم',
    resolve: (now) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

/** Formats a Date as the value a <input type="datetime-local"> expects, in local time. */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
