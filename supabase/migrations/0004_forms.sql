-- =====================================================================
-- SocialSales OS — Phase 4: Forms + WhatsApp
-- =====================================================================
-- Public visitors must be able to submit a lead-capture form on a
-- published landing page WITHOUT getting broad INSERT rights on the
-- `leads` table (that would let anyone insert a lead into any
-- workspace by guessing/spoofing a workspace_id). Instead we expose a
-- single SECURITY DEFINER function that:
--   1. looks up the landing page itself (server-side, trusted),
--   2. refuses if it isn't published,
--   3. derives workspace_id from the page — never from the caller,
--   4. inserts the lead and returns only its id.
-- No new RLS policy on `leads` is needed; `leads` INSERT stays
-- restricted to workspace members exactly as before.

create or replace function public.submit_lead_from_landing_page(
  p_landing_page_id uuid,
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_lead_id uuid;
begin
  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'full_name_required';
  end if;
  if p_phone is null and p_email is null then
    raise exception 'phone_or_email_required';
  end if;

  select workspace_id into v_workspace_id
  from public.landing_pages
  where id = p_landing_page_id and status = 'published';

  if v_workspace_id is null then
    raise exception 'landing_page_not_found_or_unpublished';
  end if;

  insert into public.leads (workspace_id, full_name, phone, email, source, status)
  values (v_workspace_id, trim(p_full_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
          'landing_page_form', 'new')
  returning id into v_lead_id;

  -- Record UTM context on the same activity trail used elsewhere, so
  -- attribution (Phase 5) can read it back without a schema change.
  insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
  values (v_lead_id, v_workspace_id, null, 'created',
          jsonb_build_object(
            'source', 'landing_page_form',
            'utm_source', p_utm_source,
            'utm_medium', p_utm_medium,
            'utm_campaign', p_utm_campaign
          ));

  return v_lead_id;
end;
$$;

-- Only the anon (public) and authenticated roles may call it; it does
-- its own authorization internally (published-page check above), so
-- granting EXECUTE is safe despite the function bypassing RLS.
revoke all on function public.submit_lead_from_landing_page from public;
grant execute on function public.submit_lead_from_landing_page to anon, authenticated;

-- Simple rate limiting: cap submissions per landing page per hour to
-- blunt basic scripted abuse. Real bot protection (captcha/turnstile)
-- is a Phase 9 polish item, not built here — see CHECKLIST.md.
create table public.form_submission_log (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index form_submission_log_rate_idx
  on public.form_submission_log (landing_page_id, ip_hash, created_at);

alter table public.form_submission_log enable row level security;
-- No policies granted at all: this table is written only via the
-- SECURITY DEFINER function below, and read by nobody through the API.

create or replace function public.check_and_log_form_rate_limit(
  p_landing_page_id uuid,
  p_ip_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_count int;
begin
  select count(*) into v_recent_count
  from public.form_submission_log
  where landing_page_id = p_landing_page_id
    and ip_hash = p_ip_hash
    and created_at > now() - interval '1 hour';

  if v_recent_count >= 5 then
    return false;
  end if;

  insert into public.form_submission_log (landing_page_id, ip_hash)
  values (p_landing_page_id, p_ip_hash);

  return true;
end;
$$;

revoke all on function public.check_and_log_form_rate_limit from public;
grant execute on function public.check_and_log_form_rate_limit to anon, authenticated;
