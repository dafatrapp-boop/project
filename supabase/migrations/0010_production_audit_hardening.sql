-- =====================================================================
-- SocialSales OS — Phase 10 production audit fix
-- =====================================================================
-- Finding: is_workspace_member() and is_workspace_admin() (0001) are
-- plain boolean-returning functions, not triggers — Postgres grants
-- EXECUTE on newly created functions to PUBLIC by default, and this
-- was never explicitly revoked for these two. That makes them
-- directly callable as RPC endpoints by anon/authenticated visitors.
--
-- Impact assessment: low. Both just evaluate auth.uid() against
-- workspace_members and return true/false — calling them directly
-- leaks no data (no rows, no PII), and an anon caller always gets
-- false since auth.uid() is null for them. This is a hygiene/
-- defense-in-depth fix, not a patch for an exploited leak.
--
-- All other SECURITY DEFINER functions in this project either (a)
-- have explicit revoke+grant already (submit_lead_from_landing_page,
-- check_and_log_form_rate_limit, get_public_pixel_id,
-- get_invitation_by_token, accept_workspace_invitation), or (b) are
-- trigger functions (`returns trigger`), which Postgres refuses to
-- execute outside an actual trigger firing regardless of grants —
-- so this migration is the only place action was needed.

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke all on function public.is_workspace_admin(uuid) from public;
grant execute on function public.is_workspace_admin(uuid) to authenticated;
