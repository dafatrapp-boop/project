import { requireWorkspace } from '@/lib/workspace';
import { hasFeature } from '@/lib/plans/constants';
import { GlobalSearch } from './global-search';
import { NotificationBell, type NotificationItem } from './notification-bell';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { HeaderInstallButton } from '@/components/pwa/install-app-control';

// Reads workspace/plan via requireWorkspace() instead of taking a
// workspaceId prop and re-querying `workspaces.plan` itself — that used
// to be a 4th independent fetch of the same row the layout had already
// resolved. requireWorkspace() is backed by a per-request cache(), so
// this call resolves instantly here without an extra round trip.
export async function Header() {
  const { supabase, workspaceId, plan } = await requireWorkspace();
  const showSearch = hasFeature(plan, 'globalSearch');
  const showNotifications = hasFeature(plan, 'notificationCenter');

  // These two are independent of each other (the RPC only needs
  // workspaceId, already resolved above) — previously awaited
  // sequentially for no reason.
  const [, { data: notifications }] = await Promise.all([
    // Opportunistic check (not a real cron job — see migration 0012's
    // comment) — cheap enough to run on every dashboard page load, and
    // internally rate-limited to one notification per 24h. Runs
    // regardless of plan — a workspace approaching expiry should always
    // be told, even if it can't see the rest of the notification center.
    supabase.rpc('check_plan_expiry_notification', { p_workspace_id: workspaceId }),
    showNotifications
      ? supabase
          .from('notifications')
          .select('id, type, title, body, link, read_at, created_at')
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] as NotificationItem[] }),
  ]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur-sm md:px-8">
      <Breadcrumbs />
      <div className="flex flex-1 items-center justify-end gap-1.5">
        {showSearch && <GlobalSearch />}
        <ThemeToggle />
        <HeaderInstallButton />
        {showNotifications && <NotificationBell notifications={notifications ?? []} />}
      </div>
    </header>
  );
}
