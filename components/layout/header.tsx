import { createClient } from '@/lib/supabase/server';
import { hasFeature, type Plan } from '@/lib/plans/constants';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Phase 3: same data-fetching as before (plan lookup, plan-expiry RPC,
// notification query) — only the JSX layout below changed, adding a
// breadcrumb trail on the start side and a theme toggle on the end
// side next to search/notifications.
export async function Header({ workspaceId }: { workspaceId: string }) {
  const supabase = createClient();

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan')
    .eq('id', workspaceId)
    .single();
  const plan = (workspace?.plan ?? 'free') as Plan;
  const showSearch = hasFeature(plan, 'globalSearch');
  const showNotifications = hasFeature(plan, 'notificationCenter');

  // Opportunistic check (not a real cron job — see migration 0012's
  // comment) — cheap enough to run on every dashboard page load, and
  // internally rate-limited to one notification per 24h. Runs
  // regardless of plan — a workspace approaching expiry should always
  // be told, even if it can't see the rest of the notification center.
  await supabase.rpc('check_plan_expiry_notification', { p_workspace_id: workspaceId });

  const { data: notifications } = showNotifications
    ? await supabase
        .from('notifications')
        .select('id, type, title, body, link, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur-sm md:px-8">
      <Breadcrumbs />
      <div className="flex flex-1 items-center justify-end gap-1.5">
        {showSearch && <GlobalSearch />}
        <ThemeToggle />
        {showNotifications && <NotificationBell notifications={notifications ?? []} />}
      </div>
    </header>
  );
}
