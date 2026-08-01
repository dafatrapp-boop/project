'use server';

import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

export interface SubmitLeadResult {
  ok: boolean;
  error?: string;
  leadId?: string;
}

export async function submitLeadFormAction(
  landingPageId: string,
  formData: FormData
): Promise<SubmitLeadResult> {
  // Honeypot: a hidden field real visitors never fill in. Bots that
  // blindly fill every input trip this and get silently rejected.
  if (String(formData.get('company_website') ?? '').length > 0) {
    return { ok: false, error: 'rejected' };
  }

  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const utmSource = String(formData.get('utm_source') ?? '') || null;
  const utmMedium = String(formData.get('utm_medium') ?? '') || null;
  const utmCampaign = String(formData.get('utm_campaign') ?? '') || null;

  if (!fullName || (!phone && !email)) {
    return { ok: false, error: 'missing_fields' };
  }

  const forwardedFor = headers().get('x-forwarded-for') ?? 'unknown';
  const ipHash = hashIp(forwardedFor.split(',')[0].trim());

  const supabase = createClient();

  const { data: allowed } = await supabase.rpc('check_and_log_form_rate_limit', {
    p_landing_page_id: landingPageId,
    p_ip_hash: ipHash,
  });

  if (!allowed) {
    return { ok: false, error: 'rate_limited' };
  }

  const { data: leadId, error } = await supabase.rpc('submit_lead_from_landing_page', {
    p_landing_page_id: landingPageId,
    p_full_name: fullName,
    p_phone: phone || null,
    p_email: email || null,
    p_utm_source: utmSource,
    p_utm_medium: utmMedium,
    p_utm_campaign: utmCampaign,
  });

  if (error || !leadId) {
    console.error('[submit_lead_from_landing_page] failed:', error);
    return { ok: false, error: 'submit_failed' };
  }

  return { ok: true, leadId: leadId as string };
}

export interface BookAppointmentResult {
  ok: boolean;
  error?: string;
  appointmentId?: string;
}

export async function bookAppointmentAction(
  landingPageId: string,
  formData: FormData
): Promise<BookAppointmentResult> {
  if (String(formData.get('company_website') ?? '').length > 0) {
    return { ok: false, error: 'rejected' };
  }

  const customerName = String(formData.get('customerName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');

  if (!customerName || !date || !time || (!phone && !email)) {
    return { ok: false, error: 'missing_fields' };
  }

  const forwardedFor = headers().get('x-forwarded-for') ?? 'unknown';
  const ipHash = hashIp(forwardedFor.split(',')[0].trim());

  const supabase = createClient();

  // Reuses the same generic per-page/per-IP limiter the lead form uses
  // (0006_meta_pixel.sql) — it isn't lead-specific, just landing-page +
  // IP keyed, so it applies here unchanged.
  const { data: allowed } = await supabase.rpc('check_and_log_form_rate_limit', {
    p_landing_page_id: landingPageId,
    p_ip_hash: ipHash,
  });

  if (!allowed) {
    return { ok: false, error: 'rate_limited' };
  }

  const { data: appointmentId, error } = await supabase.rpc('book_appointment_slot', {
    p_landing_page_id: landingPageId,
    p_date: date,
    p_start_time: time,
    p_customer_name: customerName,
    p_phone: phone || null,
    p_email: email || null,
  });

  if (error || !appointmentId) {
    console.error('[book_appointment_slot] failed:', error);
    const message = error?.message ?? '';
    if (message.includes('slot_full')) return { ok: false, error: 'slot_full' };
    if (message.includes('holiday') || message.includes('non_working_day') || message.includes('outside_working_hours')) {
      return { ok: false, error: 'unavailable' };
    }
    return { ok: false, error: 'submit_failed' };
  }

  return { ok: true, appointmentId: appointmentId as string };
}
