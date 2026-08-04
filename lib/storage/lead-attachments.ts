import { createClient } from '@/lib/supabase/client';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB, matches the bucket limit (0035_lead_attachments.sql)
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface AttachmentUploadResult {
  ok: boolean;
  path?: string;
  error?: string;
}

/**
 * Uploads directly from the browser to the private `lead-attachments`
 * bucket. Path is `{workspaceId}/{leadId}/{filename}`, matching the
 * storage RLS policies in 0035_lead_attachments.sql. Caller is
 * responsible for recording the row in `lead_attachments` afterward
 * (kept as two steps, same as the landing-page-images flow, so a
 * failed metadata insert doesn't leave an orphaned successful upload
 * indistinguishable from a real attachment).
 */
export async function uploadLeadAttachment(
  workspaceId: string,
  leadId: string,
  file: File
): Promise<AttachmentUploadResult> {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return { ok: false, error: 'نوع الملف غير مدعوم.' };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'حجم الملف كبير جدًا. الحد الأقصى 10 ميجابايت.' };
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${workspaceId}/${leadId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('lead-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { ok: false, error: `تعذر رفع الملف: ${error.message}` };
  }

  return { ok: true, path };
}

/** Private bucket — every view needs a short-lived signed URL, no public getPublicUrl(). */
export async function getLeadAttachmentUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from('lead-attachments').createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
