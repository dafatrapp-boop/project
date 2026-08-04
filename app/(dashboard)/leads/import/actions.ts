'use server';

import { revalidatePath } from 'next/cache';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';

interface ParsedRow {
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  tags: string[];
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

// Includes the exact column names Google Contacts' own CSV export
// uses (e.g. "Given Name", "Phone 1 - Value") so a merchant can export
// straight from Google Contacts and import here with zero manual
// renaming — the closest thing to a real Google Contacts integration
// achievable without Google's own OAuth app (see final report).
const HEADER_ALIASES: Record<string, keyof ParsedRow | 'given_name' | 'family_name'> = {
  'الاسم': 'full_name',
  name: 'full_name',
  full_name: 'full_name',
  'given name': 'given_name',
  'first name': 'given_name',
  'family name': 'family_name',
  'last name': 'family_name',
  'الهاتف': 'phone',
  phone: 'phone',
  'phone 1 - value': 'phone',
  'mobile phone': 'phone',
  'البريد الإلكتروني': 'email',
  email: 'email',
  'e-mail 1 - value': 'email',
  'e-mail address': 'email',
  'المصدر': 'source',
  source: 'source',
  'الوسوم': 'tags',
  tags: 'tags',
  labels: 'tags', // Google Contacts' own "group" column
};

export interface ImportResult {
  ok: boolean;
  error?: string;
  imported?: number;
  skipped?: number;
  duplicates?: number;
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
  const colIndex: Partial<Record<keyof ParsedRow | 'given_name' | 'family_name', number>> = {};
  header.forEach((h, i) => {
    const field = HEADER_ALIASES[h];
    if (field && colIndex[field] === undefined) colIndex[field] = i;
  });

  // Google Contacts (and some other exports) split the name into two
  // columns instead of one — fall back to combining them when there's
  // no single "name" column.
  const hasSplitName = colIndex.given_name !== undefined || colIndex.family_name !== undefined;
  if (colIndex.full_name === undefined && !hasSplitName) {
    return { ok: false, error: 'لم يتم العثور على عمود الاسم. تأكد من وجود عمود باسم "name" أو "الاسم".' };
  }

  const parsed: ParsedRow[] = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const fullName =
      colIndex.full_name !== undefined
        ? row[colIndex.full_name]?.trim()
        : [
            colIndex.given_name !== undefined ? row[colIndex.given_name]?.trim() : '',
            colIndex.family_name !== undefined ? row[colIndex.family_name]?.trim() : '',
          ]
            .filter(Boolean)
            .join(' ');

    if (!fullName) {
      skipped++;
      continue;
    }
    const tagsRaw = colIndex.tags !== undefined ? row[colIndex.tags]?.trim() : '';
    parsed.push({
      full_name: fullName,
      phone: colIndex.phone !== undefined ? row[colIndex.phone]?.trim() || null : null,
      email: colIndex.email !== undefined ? row[colIndex.email]?.trim() || null : null,
      source: colIndex.source !== undefined ? row[colIndex.source]?.trim() || 'csv_import' : 'csv_import',
      tags: tagsRaw ? tagsRaw.split(/[,;:]+/).map((t) => t.trim()).filter(Boolean).slice(0, 10) : [],
    });
  }

  // Cap a single import to keep this a reasonable synchronous request
  // rather than needing a background job — large files should be split.
  const MAX_ROWS = 500;
  const capped = parsed.slice(0, MAX_ROWS);

  // Duplicate detection during bulk import — previously only the
  // manual single-add form checked for an existing phone/email match;
  // a CSV (the far more likely source of real duplicates) had none at
  // all. One batched query instead of 500 round trips: fetch every
  // existing lead in this workspace whose phone/email appears anywhere
  // in this file, then skip any import row that matches.
  const phones = Array.from(new Set(capped.map((r) => r.phone).filter((v): v is string => Boolean(v))));
  const emails = Array.from(new Set(capped.map((r) => r.email).filter((v): v is string => Boolean(v))));

  // Two separate `.in()` queries instead of building a raw PostgREST
  // `.or()` filter string by hand — phone/email values come straight
  // from an uploaded file, and letting arbitrary cell content flow
  // into a hand-built filter expression is exactly the kind of thing
  // to avoid even when, as here, workspace_id scoping means the blast
  // radius of a malformed filter is "duplicate check silently finds
  // nothing" rather than a real data leak.
  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();
  const [{ data: phoneMatches }, { data: emailMatches }] = await Promise.all([
    phones.length > 0
      ? supabase.from('leads').select('phone').eq('workspace_id', workspaceId).is('deleted_at', null).in('phone', phones)
      : Promise.resolve({ data: [] as { phone: string | null }[] }),
    emails.length > 0
      ? supabase.from('leads').select('email').eq('workspace_id', workspaceId).is('deleted_at', null).in('email', emails)
      : Promise.resolve({ data: [] as { email: string | null }[] }),
  ]);
  for (const row of phoneMatches ?? []) {
    if (row.phone) existingPhones.add(row.phone);
  }
  for (const row of emailMatches ?? []) {
    if (row.email) existingEmails.add(row.email);
  }

  let duplicates = 0;
  const toInsert = capped
    .filter((r) => {
      const isDuplicate = (r.phone && existingPhones.has(r.phone)) || (r.email && existingEmails.has(r.email));
      if (isDuplicate) duplicates++;
      return !isDuplicate;
    })
    .map((r) => ({
      workspace_id: workspaceId,
      full_name: r.full_name,
      phone: r.phone,
      email: r.email,
      source: r.source,
      tags: r.tags,
      status: 'new' as const,
      campaign_id: null,
      assigned_to: null,
      notes: null,
    }));

  if (toInsert.length === 0) {
    return {
      ok: false,
      error: duplicates > 0 ? 'كل الصفوف الصالحة كانت مكررة — لم يتم استيراد أي عميل جديد.' : 'لم يتم العثور على أي صف صالح للاستيراد.',
    };
  }

  const { error } = await supabase.from('leads').insert(toInsert);
  if (error) {
    return { ok: false, error: 'تعذر استيراد الملف. حاول مرة أخرى.' };
  }

  revalidatePath('/leads');
  return {
    ok: true,
    imported: toInsert.length,
    skipped: skipped + Math.max(0, parsed.length - MAX_ROWS),
    duplicates,
  };
}
