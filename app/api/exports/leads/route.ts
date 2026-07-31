import { NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspace';
import { LEAD_STATUS_LABELS } from '@/lib/leads/constants';

function toCsvValue(value: unknown) {
  const str = value === null || value === undefined ? '' : String(value);
  // Escape quotes and wrap in quotes if it contains a comma, quote, or newline.
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('full_name, phone, email, source, status, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }

  const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'المصدر', 'الحالة', 'تاريخ الإضافة'];
  const rows = (leads ?? []).map((l) => [
    l.full_name,
    l.phone ?? '',
    l.email ?? '',
    l.source ?? '',
    LEAD_STATUS_LABELS[l.status],
    new Date(l.created_at).toISOString(),
  ]);

  // UTF-8 BOM so Excel opens Arabic text correctly instead of mojibake.
  const bom = '\uFEFF';
  const csv =
    bom +
    [headers, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
