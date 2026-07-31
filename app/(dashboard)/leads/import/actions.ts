'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';

interface ParsedRow {
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
}

/**
 * Minimal, dependency-free CSV parser — handles quoted fields and
 * commas inside quotes, which covers what Excel/Google Sheets export.
 * Does not handle exotic CSV edge cases (embedded newlines inside a
 * quoted field); good enough for a simple leads import, not a general
 * CSV engine.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

const HEADER_ALIASES: Record<string, keyof ParsedRow> = {
  'الاسم': 'full_name',
  'name': 'full_name',
  'full_name': 'full_name',
  'الهاتف': 'phone',
  'phone': 'phone',
  'البريد الإلكتروني': 'email',
  'email': 'email',
  'المصدر': 'source',
  'source': 'source',
};

export interface ImportResult {
  ok: boolean;
  error?: string;
  imported?: number;
  skipped?: number;
}

export async function importLeadsCsvAction(formData: FormData): Promise<ImportResult> {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'csvImport')) {
    return { ok: false, error: 'استيراد CSV يتطلب باقة نمو أو أعلى.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'يرجى اختيار ملف CSV.' };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: 'حجم الملف كبير جدًا (الحد الأقصى 2 ميجابايت).' };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, error: 'الملف فارغ أو لا يحتوي بيانات كافية.' };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex: Partial<Record<keyof ParsedRow, number>> = {};
  header.forEach((h, i) => {
    const field = HEADER_ALIASES[h];
    if (field && colIndex[field] === undefined) colIndex[field] = i;
  });

  if (colIndex.full_name === undefined) {
    return { ok: false, error: 'لم يتم العثور على عمود الاسم. تأكد من وجود عمود باسم "name" أو "الاسم".' };
  }

  const parsed: ParsedRow[] = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const fullName = row[colIndex.full_name]?.trim();
    if (!fullName) {
      skipped++;
      continue;
    }
    parsed.push({
      full_name: fullName,
      phone: colIndex.phone !== undefined ? row[colIndex.phone]?.trim() || null : null,
      email: colIndex.email !== undefined ? row[colIndex.email]?.trim() || null : null,
      source: colIndex.source !== undefined ? row[colIndex.source]?.trim() || 'csv_import' : 'csv_import',
    });
  }

  // Cap a single import to keep this a reasonable synchronous request
  // rather than needing a background job — large files should be split.
  const MAX_ROWS = 500;
    const toInsert = parsed.slice(0, MAX_ROWS).map((r) => ({
    workspace_id: workspaceId,
    full_name: r.full_name,
    phone: r.phone,
    email: r.email,
    source: r.source,
    status: 'new' as const,
    campaign_id: null,
    assigned_to: null,
    notes: null,
  }));


  if (toInsert.length === 0) {
    return { ok: false, error: 'لم يتم العثور على أي صف صالح للاستيراد.' };
  }

  const { error } = await supabase.from('leads').insert(toInsert);
  if (error) {
    return { ok: false, error: 'تعذر استيراد الملف. حاول مرة أخرى.' };
  }

  revalidatePath('/leads');
  return { ok: true, imported: toInsert.length, skipped: skipped + Math.max(0, parsed.length - MAX_ROWS) };
}
