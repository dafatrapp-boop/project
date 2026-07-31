import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';

export interface SearchResult {
  type: 'lead' | 'landing_page' | 'campaign';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export async function GET(request: NextRequest) {
  const { supabase, workspaceId, plan } = await requireWorkspace();

  if (!hasFeature(plan, 'globalSearch')) {
    return NextResponse.json({ error: 'feature_requires_upgrade', results: [] }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [{ data: leads }, { data: pages }, { data: campaigns }] = await Promise.all([
    supabase
      .from('leads')
      .select('id, full_name, phone, status')
      .eq('workspace_id', workspaceId)
      .textSearch('search_vector', q, { type: 'websearch' })
      .limit(5),
    supabase
      .from('landing_pages')
      .select('id, title, status')
      .eq('workspace_id', workspaceId)
      .ilike('title', `%${q}%`)
      .limit(5),
    supabase
      .from('campaigns')
      .select('id, name, platform')
      .eq('workspace_id', workspaceId)
      .ilike('name', `%${q}%`)
      .limit(5),
  ]);

  const results: SearchResult[] = [
    ...(leads ?? []).map((l) => ({
      type: 'lead' as const,
      id: l.id,
      title: l.full_name,
      subtitle: l.phone ?? l.status,
      href: `/leads/${l.id}`,
    })),
    ...(pages ?? []).map((p) => ({
      type: 'landing_page' as const,
      id: p.id,
      title: p.title,
      subtitle: p.status === 'published' ? 'منشورة' : 'مسودة',
      href: `/landing-pages/${p.id}/edit`,
    })),
    ...(campaigns ?? []).map((c) => ({
      type: 'campaign' as const,
      id: c.id,
      title: c.name,
      subtitle: c.platform,
      href: `/campaigns/${c.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
