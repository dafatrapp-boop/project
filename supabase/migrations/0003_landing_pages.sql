-- =====================================================================
-- SocialSales OS — Phase 3: Landing Page Builder
-- =====================================================================

do $$ begin
  create type public.landing_page_status as enum ('draft', 'published');
exception when duplicate_object then null;
end $$;

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  slug text not null,
  template text not null default 'general',
  status public.landing_page_status not null default 'draft',
  -- sections is an ordered array of { type, ...fields }, validated at the
  -- application layer (see lib/landing-pages/types.ts) rather than with
  -- a rigid DB schema, since section shapes evolve fastest of any part
  -- of the product.
  sections jsonb not null default '[]',
  whatsapp_number text,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists landing_pages_workspace_idx on public.landing_pages (workspace_id);
create index if not exists landing_pages_public_slug_idx on public.landing_pages (slug) where status = 'published';

-- Safety net (same reasoning as workspaces/workspace_members in
-- 0001_foundation.sql): add any inline column a pre-existing
-- landing_pages table might be missing — this is exactly what was
-- missing published_at in the error you hit.
alter table public.landing_pages add column if not exists title text;
alter table public.landing_pages add column if not exists slug text;
alter table public.landing_pages add column if not exists template text not null default 'general';
alter table public.landing_pages add column if not exists status public.landing_page_status not null default 'draft';
alter table public.landing_pages add column if not exists sections jsonb not null default '[]';
alter table public.landing_pages add column if not exists whatsapp_number text;
alter table public.landing_pages add column if not exists meta_title text;
alter table public.landing_pages add column if not exists meta_description text;
alter table public.landing_pages add column if not exists published_at timestamptz;
alter table public.landing_pages add column if not exists created_at timestamptz not null default now();
alter table public.landing_pages add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.landing_pages add constraint landing_pages_workspace_id_slug_key unique (workspace_id, slug);
exception when duplicate_object then null;
end $$;

alter table public.landing_pages enable row level security;

-- Workspace members manage their own pages.
drop policy if exists "landing_pages_select_member" on public.landing_pages;
create policy "landing_pages_select_member"
  on public.landing_pages for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "landing_pages_insert_member" on public.landing_pages;
create policy "landing_pages_insert_member"
  on public.landing_pages for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "landing_pages_update_member" on public.landing_pages;
create policy "landing_pages_update_member"
  on public.landing_pages for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "landing_pages_delete_admin" on public.landing_pages;
create policy "landing_pages_delete_admin"
  on public.landing_pages for delete
  using (public.is_workspace_admin(workspace_id));

-- Public (anon, unauthenticated) visitors may read ONLY published pages.
-- This is what powers the public /p/[slug] route — it uses the plain
-- anon client, never the service role, and relies entirely on this
-- policy for its security boundary.
drop policy if exists "landing_pages_select_public_published" on public.landing_pages;
create policy "landing_pages_select_public_published"
  on public.landing_pages for select
  to anon
  using (status = 'published');

drop trigger if exists landing_pages_set_updated_at on public.landing_pages;
create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- landing_page_views: minimal visit counter, feeds Phase 7 analytics.
-- Insert-only from the public route; never readable by anon.
-- ---------------------------------------------------------------------
create table if not exists public.landing_page_views (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists landing_page_views_page_idx on public.landing_page_views (landing_page_id, created_at desc);

alter table public.landing_page_views enable row level security;

drop policy if exists "views_select_member" on public.landing_page_views;
create policy "views_select_member"
  on public.landing_page_views for select
  using (public.is_workspace_member(workspace_id));

-- Public visitors may INSERT a view row (their own visit) but can never
-- read view data back — this keeps analytics private to the workspace.
drop policy if exists "views_insert_public" on public.landing_page_views;
create policy "views_insert_public"
  on public.landing_page_views for insert
  to anon
  with check (true);

-- Never trust a client-supplied workspace_id: derive it from the
-- landing page itself so a visitor can't attribute a view to a
-- workspace that doesn't own the page being viewed.
create or replace function public.set_view_workspace_id()
returns trigger as $$
begin
  select workspace_id into new.workspace_id
  from public.landing_pages where id = new.landing_page_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists before_insert_view_set_workspace on public.landing_page_views;
create trigger before_insert_view_set_workspace
  before insert on public.landing_page_views
  for each row execute procedure public.set_view_workspace_id();
