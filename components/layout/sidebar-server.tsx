import { requireWorkspace } from '@/lib/workspace';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';
import { Sidebar } from './sidebar';

/**
 * Thin async wrapper so the layout can wrap just the sidebar's data
 * dependency in its own <Suspense> boundary (see (dashboard)/layout.tsx)
 * instead of blocking the entire shell — including the page content
 * itself — on this one query. Resolves from the same cached
 * requireWorkspace() call the rest of the shell already shares.
 */
export async function SidebarServer() {
  const { supabase, workspaceId, name, industry } = await requireWorkspace();

  const { data: appointmentSettings } = await supabase
    .from('appointment_settings')
    .select('enabled')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const showAppointments = !!appointmentSettings?.enabled;
  const showOrders = ORDER_RELEVANT_INDUSTRIES.includes(
    industry as (typeof ORDER_RELEVANT_INDUSTRIES)[number]
  );

  return <Sidebar showAppointments={showAppointments} showOrders={showOrders} workspaceName={name} />;
}
