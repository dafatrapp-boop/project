-- =====================================================================
-- Phase 39 — Realtime for the Kanban pipeline (gaps-checklist 6.1).
--
-- Scoped narrowly to `leads`: the Kanban board is the one view where
-- staleness is a real multi-user problem (two agents working the same
-- pipeline in separate tabs, one moves a card, the other doesn't see
-- it until a manual refresh). Adding the table to the `supabase_realtime`
-- publication is the only DB-side step needed — Postgres already emits
-- these events, RLS still applies to what a subscribed client actually
-- receives (Realtime respects RLS per-connection), so this doesn't
-- widen access, only lets an already-authorized client be pushed
-- updates instead of polling.
-- =====================================================================

do $$
begin
  alter publication supabase_realtime add table public.leads;
exception when others then
  raise notice 'Could not add public.leads to supabase_realtime publication (already added, or Realtime is not enabled in this environment) — see migration 0039 comment.';
end $$;
