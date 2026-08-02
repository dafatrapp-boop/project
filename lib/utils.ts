import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Phase 4 — shared formatting helper for tel:/wa.me deep links used on
 * the Leads list and Lead detail pages (contact quick actions). Purely
 * presentational string formatting, not a data/business-logic change.
 */
export function digitsOnly(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

export function whatsAppLink(phone: string) {
  return `https://wa.me/${digitsOnly(phone).replace(/^\+/, '')}`;
}
