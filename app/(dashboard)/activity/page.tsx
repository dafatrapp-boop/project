import { requireWorkspace, requirePlanFeature } from '@/lib/workspace';
import { PageHeader } from '@/components/ui/page-header';
import { ActivityLogList, type ActivityEntry } from './activity-log-list';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, getPageRange, parsePageParam, splitPage } from '@/lib/pagination';

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { supabase, workspaceId, plan } = await requireWorkspace();
  requirePlanFeature(plan, 'activityLog', '/dashboard');
  const page = parsePageParam(searchParams.page);
  const [from, to] = getPageRange(page, DEFAULT_PAGE_SIZE);

  const { data: entriesRaw } = await supabase
    .from('workspace_activity_log')
    .select('id, actor_id, action, entity_type, entity_label, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(from, to);
  const { rows: entries, hasMore } = splitPage(entriesRaw ?? [], DEFAULT_PAGE_SIZE);

  // workspace_activity_log.actor_id references auth.users, not profiles
  // directly (no FK path PostgREST can auto-join) — same pattern as the
  // Team page fix: fetch profiles separately and merge here.
  const actorIds = Array.from(new Set(entries.map((e) => e.actor_id).filter(Boolean))) as string[];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', actorIds)
      : { data: [] };
  const nameByActor = new Map((actorProfiles ?? []).map((p) => [p.id, p.full_name]));

  const rows: ActivityEntry[] = entries.map((e) => ({
    id: e.id,
    actor_id: e.actor_id,
    action: e.action,
    entity_label: e.entity_label,
    created_at: e.created_at,
    actorName: e.actor_id ? nameByActor.get(e.actor_id) ?? 'مستخدم' : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="سجل النشاط" description="من عدّل ماذا في مساحة عملك." />
      <ActivityLogList entries={rows} />

      <Pagination page={page} hasMore={hasMore} searchParams={searchParams} basePath="/activity" />
    </div>
  );
}
