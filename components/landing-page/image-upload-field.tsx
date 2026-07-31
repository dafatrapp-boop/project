'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadLandingPageImage, deleteLandingPageImage } from '@/lib/storage/upload';

interface ImageUploadFieldProps {
  label: string;
  workspaceId: string;
  landingPageId: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}

/**
 * A plain <input type="file" accept="image/*"> is enough to get both
 * "choose from gallery" and "take a photo" as options on a phone's
 * native picker, and a normal file browser on desktop — no separate
 * mobile/desktop code paths needed.
 */
export function ImageUploadField({
  label,
  workspaceId,
  landingPageId,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setUploading(true);
    const result = await uploadLandingPageImage(workspaceId, landingPageId, file);
    setUploading(false);

    if (!result.ok) {
      setError(result.error ?? 'تعذر رفع الصورة.');
      return;
    }
    if (value) {
      void deleteLandingPageImage(value);
    }
    onChange(result.url);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>

      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-auto rounded-md border border-border object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-ink/50">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              void deleteLandingPageImage(value);
            }}
            disabled={uploading}
            className="absolute -top-2 -end-2 rounded-full bg-danger p-1 text-white hover:bg-danger/90 disabled:opacity-60"
            aria-label="إزالة الصورة"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-2 block text-xs font-medium text-brand-600 hover:underline disabled:opacity-60"
          >
            استبدال الصورة
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-subtle text-sm text-ink-muted hover:bg-surface disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              جارٍ الرفع...
            </>
          ) : (
            <>
              <ImagePlus size={18} />
              اختر صورة من الهاتف أو الكمبيوتر
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-ink-faint">JPG, PNG, WEBP أو GIF — حتى 5 ميجابايت</p>
    </div>
  );
}
