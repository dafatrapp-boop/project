-- =====================================================================
-- SocialSales OS — Stripe billing linkage
-- =====================================================================
-- These columns are populated by the webhook handler
-- (app/api/stripe/webhook/route.ts) once a real Stripe account and
-- keys are configured — they stay null until then, and nothing in the
-- app treats their absence as an error.

do $$ begin
  alter table public.workspaces
  add column stripe_customer_id text,
  add column stripe_subscription_id text;
exception when duplicate_column then null;
end $$;

create unique index if not exists workspaces_stripe_customer_idx
  on public.workspaces (stripe_customer_id)
  where stripe_customer_id is not null;
