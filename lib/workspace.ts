import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLAN_FEATURES, type Plan } from '@/lib/plans/constants';

/**
 * Every dashboard page needs "which workspace is this user acting in".
 * Phase 1-8 assume a single workspace per user (per membership row
 * created at onboarding); multi-workspace switching is a later
 * enhancement, not required by the current spec phase.
 */
export async function requireWorkspace() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    // A user can legitimately belong to more than one workspace (their
    // own + any team they were invited into). Without an explicit
    // order, Postgres gives no guarantee which row `.limit(1)` returns
    // — it can differ between requests. Prefer a workspace they own,
    // then fall back to their oldest membership, so the same user
    // always lands in the same place instead of it flipping around.
    .order('role', { ascending: true }) // member_role enum is declared ('owner','admin','agent') — Postgres enums sort by declaration order, so this already puts 'owner' first
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/onboarding/workspace');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, industry, onboarding_dismissed_at')
    .eq('id', membership.workspace_id)
    .single();

  return {
    supabase,
    user,
    workspaceId: membership.workspace_id,
    role: membership.role,
    plan: (workspace?.plan ?? 'free') as Plan,
    industry: workspace?.industry ?? 'other',
    onboardingDismissedAt: workspace?.onboarding_dismissed_at ?? null,
  };
}

/**
 * Server-side gate for a boolean plan feature (as opposed to the
 * count-based limits in PLAN_LIMITS). Redirects to /team with a clear
 * upgrade message instead of silently 404ing or crashing — same
 * pattern used for the count-based plan_limit_reached redirects
 * elsewhere in the app.
 */
export function requirePlanFeature(plan: Plan, feature: keyof (typeof PLAN_FEATURES)['free'], redirectTo = '/team') {
  if (!PLAN_FEATURES[plan][feature]) {
    redirect(`${redirectTo}?error=feature_requires_upgrade`);
  }
}
