import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { OnboardingBanner } from '@/components/layout/onboarding-banner';
import { ORDER_RELEVANT_INDUSTRIES } from '@/lib/orders/constants';
import { getOnboardingChecklist, checklistProgress } from '@/lib/onboarding/checklist';

// Every page under this layout is per-user data (workspace, leads,
// campaigns, settings...). Forcing dynamic rendering here — on top of
// the no-store fetch fix in lib/supabase/server.ts — makes sure this
// entire section of the app is never eligible for Next.js's Full
// Route Cache, in addition to bypassing the fetch-level Data Cache.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already redirects unauthenticated
  // users, but every server-rendered protected page re-checks here too.
  if (!user) redirect('/login');

  // A signed-in user with no workspace yet has nothing to see in the
  // dashboard — send them to create one first.
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/onboarding/workspace');

  const [{ data: workspace }, { data: appointmentSettings }] = await Promise.all([
    // Phase 3: added `name` to this existing select (purely additive
    // column, same query shape otherwise) so the sidebar can show which
    // workspace the user is in instead of just the product logo.
    supabase.from('workspaces').select('name, industry, onboarding_dismissed_at').eq('id', membership.workspace_id).single(),
    supabase.from('appointment_settings').select('enabled').eq('workspace_id', membership.workspace_id).maybeSingle(),
  ]);

  const showAppointments = !!appointmentSettings?.enabled;
  const showOrders = ORDER_RELEVANT_INDUSTRIES.includes(
    (workspace?.industry ?? 'other') as (typeof ORDER_RELEVANT_INDUSTRIES)[number]
  );

  let onboardingProgress: number | null = null;
  if (!workspace?.onboarding_dismissed_at) {
    const steps = await getOnboardingChecklist(supabase, membership.workspace_id);
    const progress = checklistProgress(steps);
    if (progress < 100) onboardingProgress = progress;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar showAppointments={showAppointments} showOrders={showOrders} workspaceName={workspace?.name ?? ''} />
      <div className="flex-1 pb-16 md:pb-0">
        {onboardingProgress !== null && <OnboardingBanner progress={onboardingProgress} />}
        <Header workspaceId={membership.workspace_id} />
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
