import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';
import { LEAD_STATUS_LABELS, formatLeadSource } from '@/lib/leads/constants';

export async function GET() {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'excelExport')) {
    return NextResponse.json(
      { error: 'feature_requires_upgrade', message: 'تصدير Excel يتطلب باقة نمو أو أعلى.' },
      { status: 403 }
    );
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('full_name, phone, email, source, status, tags, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }

  const rows = (leads ?? []).map((l) => ({
    'الاسم': l.full_name,
    'الهاتف': l.phone ?? '',
    'البريد الإلكتروني': l.email ?? '',
    'المصدر': formatLeadSource(l.source),
    'الحالة': LEAD_STATUS_LABELS[l.status],
    'الوسوم': (l.tags ?? []).join(', '),
    'تاريخ الإضافة': new Date(l.created_at).toISOString().slice(0, 10),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'العملاء المحتملون');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
