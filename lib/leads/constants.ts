import type { Database } from '@/types/database';

export type LeadStatus = Database['public']['Tables']['leads']['Row']['status'];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'جديد',
  contacted: 'تم التواصل',
  interested: 'مهتم',
  negotiating: 'قيد التفاوض',
  won: 'تم البيع',
  lost: 'خسارة',
};

export const LEAD_STATUS_TONE: Record<
  LeadStatus,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  new: 'neutral',
  contacted: 'brand',
  interested: 'brand',
  negotiating: 'warning',
  won: 'success',
  lost: 'danger',
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'negotiating',
  'won',
  'lost',
];

export const ACTIVITY_LABELS: Record<string, string> = {
  created: 'تمت إضافة العميل المحتمل',
  status_changed: 'تغيّرت الحالة',
  assigned: 'تم إسناد المسؤول',
  note_added: 'تمت إضافة ملاحظة',
  follow_up_completed: 'تم إنجاز متابعة',
};
