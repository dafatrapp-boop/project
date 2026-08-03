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

// Some lead sources are set internally by the system using machine-
// readable slugs (e.g. from the public landing-page form RPC, or the
// CSV importer) rather than something a person typed. Those slugs
// must never be shown to the user as-is — map the known ones to a
// clear Arabic label. Free-text sources typed by the team when adding
// a lead manually (e.g. "instagram", "whatsapp") are already
// human-readable and pass through unchanged.
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  landing_page_form: 'نموذج صفحة الهبوط',
  csv_import: 'استيراد ملف CSV',
};

export function formatLeadSource(source: string | null): string {
  if (!source) return '—';
  return LEAD_SOURCE_LABELS[source] ?? source;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  created: 'تمت إضافة العميل المحتمل',
  status_changed: 'تغيّرت الحالة',
  assigned: 'تم إسناد المسؤول',
  note_added: 'تمت إضافة ملاحظة',
  follow_up_completed: 'تم إنجاز متابعة',
};
