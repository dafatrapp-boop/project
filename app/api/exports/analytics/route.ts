import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspace';

export async function GET(request: NextRequest) {
  const { supabase, workspaceId } = await requireWorkspace();

  const rangeParam = Number(request.nextUrl.searchParams.get('range') ?? '30');
  const rangeDays = [7, 30, 90].includes(rangeParam) ? rangeParam : 30;
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);
  const sinceDate = since.toISOString().slice(0, 10);

  const [{ data: leadsDaily }, { data: viewsDaily }] = await Promise.all([
    supabase
      .from('leads_daily_counts')
      .select('day, leads_count, won_count')
      .eq('workspace_id', workspaceId)
      .gte('day', sinceDate),
    supabase
      .from('page_views_daily_counts')
      .select('day, views_count')
      .eq('workspace_id', workspaceId)
      .gte('day', sinceDate),
  ]);

  const leadsByDay = new Map((leadsDaily ?? []).map((d) => [d.day, d]));
  const viewsByDay = new Map((viewsDaily ?? []).map((d) => [d.day, d.views_count]));

  const rows: string[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const leads = leadsByDay.get(key);
    rows.push(
      [key, viewsByDay.get(key) ?? 0, leads?.leads_count ?? 0, leads?.won_count ?? 0].join(',')
    );
  }

  const bom = '\uFEFF';
  const csv = bom + ['التاريخ,الزيارات,العملاء المحتملون,عمليات البيع', ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="analytics-${rangeDays}d-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
