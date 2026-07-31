import { requireWorkspace, requirePlanFeature } from '@/lib/workspace';
import { Badge } from '@/components/ui/badge';

const ACTION_LABELS: Record<string, string> = {
  landing_page_updated: 'عدّل صفحة الهبوط',
  landing_page_deleted: 'حذف صفحة الهبوط',
  lead_deleted: 'حذف عميلًا محتملًا',
  member_added: 'أضاف عضوًا للفريق',
  member_removed: 'أزال عضوًا من الفريق',
};

const ACTION_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  landing_page_updated: 'brand',
  landing_page_deleted: 'danger',
  lead_deleted: 'danger',
  member_added: 'success',
  member_removed: 'warning',
};

export default async function ActivityLogPage() {
  const { supabase, workspaceId, plan } = await requireWorkspace();
  requirePlanFeature(plan, 'activityLog', '/dashboard');

  const { data: entries } = await supabase
    .from('workspace_activity_log')
    .select('id, actor_id, action, entity_type, entity_label, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100);

  // workspace_activity_log.actor_id references auth.users, not profiles
  // directly (no FK path PostgREST can auto-join) — same pattern as the
  // Team page fix: fetch profiles separately and merge here.
  const actorIds = Array.from(new Set((entries ?? []).map((e) => e.actor_id).filter(Boolean))) as string[];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', actorIds)
      : { data: [] };
  const nameByActor = new Map((actorProfiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">سجل النشاط</h1>
        <p className="text-sm text-ink-muted">من عدّل ماذا في مساحة عملك — آخر 100 حدث.</p>
      </div>

      {(entries ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface py-10 text-center text-sm text-ink-faint">
          لا يوجد نشاط مسجل بعد.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {(entries ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3 text-sm">
              <div className="flex items-center gap-3">
                <Badge tone={ACTION_TONE[e.action] ?? 'neutral'}>{ACTION_LABELS[e.action] ?? e.action}</Badge>
                <span className="text-ink">
                  {e.entity_label ?? '—'}
                  {e.actor_id && (
                    <span className="text-ink-faint"> · بواسطة {nameByActor.get(e.actor_id) ?? 'مستخدم'}</span>
                  )}
                </span>
              </div>
              <span className="whitespace-nowrap text-xs text-ink-faint">
                {new Date(e.created_at).toLocaleString('ar-SA')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
