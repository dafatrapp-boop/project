-- =====================================================================
-- SocialSales OS — add the "نمو" (Growth) plan tier between Starter and Pro
-- =====================================================================
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction as
-- statements that reference the new value, so this migration ONLY adds
-- the enum value. The numeric limits (pages/members/campaigns) for
-- each tier live in application code (lib/plans/constants.ts), not the
-- database — this file just makes 'growth' a valid value to store.

alter type public.workspace_plan add value if not exists 'growth' after 'starter';
