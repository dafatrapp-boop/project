import type { Database } from '@/types/database';

export type OrderStatus = Database['public']['Tables']['orders']['Row']['status'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
  preparing: 'قيد التجهيز',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger'
> = {
  pending: 'warning',
  paid: 'brand',
  preparing: 'brand',
  delivered: 'success',
  cancelled: 'danger',
};

export const ORDER_STATUS_ORDER: OrderStatus[] = ['pending', 'paid', 'preparing', 'delivered', 'cancelled'];

export const PAYMENT_METHODS = ['نقدًا', 'تحويل بنكي', 'بطاقة', 'محفظة إلكترونية', 'أخرى'];

export const CURRENCIES = ['SAR', 'AED', 'EGP', 'KWD', 'QAR', 'USD'];

/** Industries where Orders is a useful, low-complexity fit — kept
 * narrow on purpose (see final report: this isn't inventory/ERP). */
export const ORDER_RELEVANT_INDUSTRIES = ['instagram_store', 'restaurant', 'other'] as const;
