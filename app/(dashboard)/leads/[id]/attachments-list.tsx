'use client';

import { useRef, useState, useTransition } from 'react';
import { Paperclip, Download, Trash2, Loader2 } from 'lucide-react';
import { uploadLeadAttachment, getLeadAttachmentUrl } from '@/lib/storage/lead-attachments';
import { recordLeadAttachmentAction, deleteLeadAttachmentAction } from '../actions';

export interface AttachmentRow {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsList({
  leadId,
  workspaceId,
  initialAttachments,
}: {
  leadId: string;
  workspaceId: string;
  initialAttachments: AttachmentRow[];
}) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadLeadAttachment(workspaceId, leadId, file);
    setUploading(false);
    if (!result.ok || !result.path) {
      setError(result.error ?? 'تعذر رفع الملف.');
      return;
    }

    const optimistic: AttachmentRow = {
      id: `temp-${Date.now()}`,
      file_path: result.path,
      file_name: file.name,
      file_size: file.size,
      created_at: new Date().toISOString(),
    };
    setAttachments((prev) => [optimistic, ...prev]);
    startTransition(() =>
      recordLeadAttachmentAction(leadId, {
        path: result.path!,
        name: file.name,
        size: file.size,
        contentType: file.type,
      })
    );
  }

  async function handleDownload(row: AttachmentRow) {
    const url = await getLeadAttachmentUrl(row.file_path);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleDelete(row: AttachmentRow) {
    setAttachments((prev) => prev.filter((a) => a.id !== row.id));
    startTransition(() => deleteLeadAttachmentAction(row.id, row.file_path));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {attachments.length === 0 && <p className="text-body-sm text-ink-faint">لا توجد مرفقات بعد.</p>}
        {attachments.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-subtle px-3 py-2">
            <button
              onClick={() => handleDownload(row)}
              className="flex min-w-0 items-center gap-2 text-body-sm text-ink hover:text-brand-600"
            >
              <Paperclip size={14} className="shrink-0 text-ink-faint" />
              <span className="truncate">{row.file_name}</span>
              <span className="shrink-0 text-caption text-ink-faint">({formatSize(row.file_size)})</span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => handleDownload(row)}
                aria-label="تنزيل"
                className="rounded-md p-1.5 text-ink-faint hover:bg-brand-50 hover:text-brand-600"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => handleDelete(row)}
                aria-label="حذف المرفق"
                className="rounded-md p-1.5 text-ink-faint hover:bg-danger-50 hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-caption text-danger">{error}</p>}

      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-body-sm text-ink-muted hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
          {uploading ? 'جارٍ الرفع...' : 'إرفاق ملف'}
        </button>
      </div>
    </div>
  );
}
