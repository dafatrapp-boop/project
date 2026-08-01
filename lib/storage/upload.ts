import { createClient } from '@/lib/supabase/client';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads an image directly from the browser to Supabase Storage —
 * no server round-trip for the file bytes themselves, just the
 * upload call (auth'd via the same session cookie/token the rest of
 * the app uses). Path is `{workspaceId}/{landingPageId}/{filename}`,
 * which the storage RLS policies (0011_storage_images.sql) rely on to
 * check workspace membership via the first path segment.
 */
export async function uploadLandingPageImage(
  workspaceId: string,
  landingPageId: string,
  file: File
): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WEBP أو GIF.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'حجم الصورة كبير جدًا. الحد الأقصى 5 ميجابايت.' };
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${workspaceId}/${landingPageId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('landing-page-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { ok: false, error: `تعذر رفع الصورة: ${error.message}` };
  }

  const { data } = supabase.storage.from('landing-page-images').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * Deletes an uploaded image from Storage given its public URL. Safe to
 * call even if the URL is malformed or the object is already gone —
 * failures here are non-fatal (the section's imageUrl is cleared
 * either way; a failed delete just leaves an orphaned file rather
 * than breaking the user's edit).
 */
export async function deleteLandingPageImage(publicUrl: string): Promise<void> {
  const marker = '/landing-page-images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);

  const supabase = createClient();
  await supabase.storage.from('landing-page-images').remove([path]);
}

