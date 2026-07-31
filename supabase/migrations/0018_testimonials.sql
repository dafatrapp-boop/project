-- =====================================================================
-- SocialSales OS — Phase 18: Testimonials
--
-- No customer account/login involved at all — every testimonial is
-- entered and curated entirely from the merchant dashboard. Showing
-- them on the public landing page reuses the exact same "add/remove a
-- section" mechanism already built for hero/features/cta/form/footer
-- (see lib/landing-pages/types.ts) instead of inventing a separate
-- enable/disable switch: if the merchant doesn't add a Testimonials
-- section to the page, it never renders — that already is the on/off
-- toggle the spec asked for.
-- =====================================================================

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_name text not null,
  avatar_url text,
  subtitle text, -- city or job title, optional
  rating smallint not null default 5 check (rating between 1 and 5),
  body text not null,
  is_visible boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index testimonials_workspace_idx
  on public.testimonials (workspace_id, display_order, created_at desc);

alter table public.testimonials enable row level security;

create policy "testimonials_select_member"
  on public.testimonials for select
  using (public.is_workspace_member(workspace_id));

create policy "testimonials_insert_member"
  on public.testimonials for insert
  with check (public.is_workspace_member(workspace_id));

create policy "testimonials_update_member"
  on public.testimonials for update
  using (public.is_workspace_member(workspace_id));

create policy "testimonials_delete_member"
  on public.testimonials for delete
  using (public.is_workspace_member(workspace_id));

-- Public read for the landing page: only visible testimonials, and
-- only through a published page — same trust boundary shape as
-- landing_pages_select_public_published.
create policy "testimonials_select_public"
  on public.testimonials for select
  to anon
  using (
    is_visible = true
    and exists (
      select 1 from public.landing_pages lp
      where lp.workspace_id = testimonials.workspace_id and lp.status = 'published'
    )
  );
