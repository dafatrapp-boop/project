import type { Database } from '@/types/database';

export type AppointmentStatus = Database['public']['Tables']['appointments']['Row']['status'];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const APPOINTMENT_STATUS_TONE: Record<
  AppointmentStatus,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  pending: 'warning',
  confirmed: 'brand',
  completed: 'success',
  cancelled: 'danger',
};

export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

/** Industries the appointment feature is switched on for automatically
 * at signup — kept in sync with industry_defaults_to_appointments() in
 * 0016_appointments.sql. Merchants can still enable/disable manually
 * from Settings regardless of this list. */
export const APPOINTMENT_DEFAULT_INDUSTRIES = [
  'clinic',
  'training_center',
  'beauty_salon',
  'lawyer',
  'consultant',
] as const;

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export const WEEKDAY_ORDER = [0, 1, 2, 3, 4, 5, 6];
