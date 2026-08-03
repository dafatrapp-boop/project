import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { PLAN_FEATURES, type Plan } from '@/lib/plans/constants';

export interface WorkspaceData {
  workspaceId: string;
  role: string;
  plan: Plan;
  industry: string;
  name: string;
  metaPixelId: string | null;
  onboardingDismissedAt: string | null;
}

interface SessionContext {
  supabase: ReturnType<typeof createClient>;
  user: User | null;
  workspace: WorkspaceData | null;
}

/**
 * Resolves the signed-in user and their primary workspace exactly once
 * per request. Every dashboard page, the layout's sidebar/header, and
 * requireWorkspace() itself used to each run their own independent
 * getUser() + workspace_members() + workspaces() round trips (up to 7
 * queries for one page load, confirmed by the startup-performance
 * audit). React's cache() memoizes this function per render pass, so
 * every one of those call sites now shares a single in-flight promise
 * instead of re-querying — no change to the "never cache across users"
 * policy in lib/supabase/server.ts, this only dedupes *within* one
 * user's own request.
 */
export const getSessionContext = cache(async (): Promise<SessionContext> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, workspace: null };

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name, industry, meta_pixel_id, plan, onboarding_dismissed_at)')
    .eq('user_id', user.id)
    // A user can legitimately belong to more than one workspace (their
    // own + any team they were invited into). Without an explicit
    // order, Postgres gives no guarantee which row `.limit(1)` returns.
    // Prefer a workspace they own, then their oldest membership, so the
    // same user always lands in the same place across requests.
    .order('role', { ascending: true }) // member_role enum ('owner','admin','agent') sorts by declaration order
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return { supabase, user, workspace: null };

  const workspaceRaw = membership.workspaces as
    | { name: string; industry: string; meta_pixel_id: string | null; plan: Plan; onboarding_dismissed_at: string | null }
    | { name: string; industry: string; meta_pixel_id: string | null; plan: Plan; onboarding_dismissed_at: string | null }[]
    | null;
  const ws = Array.isArray(workspaceRaw) ? workspaceRaw[0] ?? null : workspaceRaw;

  return {
    supabase,
    user,
    workspace: {
      workspaceId: membership.workspace_id,
      role: membership.role,
      plan: (ws?.plan ?? 'free') as Plan,
      industry: ws?.industry ?? 'other',
      name: ws?.name ?? '',
      metaPixelId: ws?.meta_pixel_id ?? null,
      onboardingDismissedAt: ws?.onboarding_dismissed_at ?? null,
    },
  };
});

/**
 * Every dashboard page needs "which workspace is this user acting in".
 * Safe to call from multiple components within the same request (page,
 * layout, header) — they all resolve from the single cached call above.
 */
export async function requireWorkspace() {
  const { supabase, user, workspace } = await getSessionContext();

  if (!user) redirect('/login');
  if (!workspace) redirect('/onboarding/workspace');

  return {
    supabase,
    user,
    workspaceId: workspace.workspaceId,
    role: workspace.role,
    plan: workspace.plan,
    industry: workspace.industry,
    name: workspace.name,
    metaPixelId: workspace.metaPixelId,
    onboardingDismissedAt: workspace.onboardingDismissedAt,
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
