-- =====================================================================
-- SocialSales OS — Phase 17: Orders (deliberately minimal)
--
-- Not an ERP/inventory system by design — see the final report for
-- why. Just enough to record "this lead bought this, for this much,
-- paid how, status what" and roll it up on the dashboard.
-- =====================================================================

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'preparing', 'delivered', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  product_name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  currency text not null default 'SAR',
  payment_method text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_workspace_created_idx on public.orders (workspace_id, created_at desc);
create index if not exists orders_lead_idx on public.orders (lead_id);

alter table public.orders enable row level security;

drop policy if exists "orders_select_member" on public.orders;
create policy "orders_select_member"
  on public.orders for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "orders_insert_member" on public.orders;
create policy "orders_insert_member"
  on public.orders for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "orders_update_member" on public.orders;
create policy "orders_update_member"
  on public.orders for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
  on public.orders for delete
  using (public.is_workspace_admin(workspace_id));

create or replace function public.set_orders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_orders_updated on public.orders;
create trigger on_orders_updated
  before update on public.orders
  for each row execute procedure public.set_orders_updated_at();

-- Rollup for the dashboard cards: Total Orders / Total Sales / Revenue.
-- Sales = everything not cancelled (what was actually ordered).
-- Revenue = only orders that resulted in real, collected money.
-- security_invoker = true so RLS on `orders` applies to the querying
-- user, not the view owner — same pattern as campaign_stats /
-- leads_daily_counts (0005/0007/0009).
create or replace view public.order_stats
with (security_invoker = true)
as
select
  workspace_id,
  count(*) filter (where status != 'cancelled') as total_orders,
  coalesce(sum(price) filter (where status != 'cancelled'), 0) as total_sales,
  coalesce(sum(price) filter (where status in ('paid', 'delivered')), 0) as revenue
from public.orders
group by workspace_id;
