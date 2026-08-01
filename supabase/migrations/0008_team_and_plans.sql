-- =====================================================================
-- SocialSales OS — Phase 8: Team + Plans
-- =====================================================================

do $$ begin
  create type public.workspace_plan as enum ('free', 'starter', 'pro');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.workspaces
  add column plan public.workspace_plan not null default 'free';
exception when duplicate_column then null;
end $$;

-- Type-fix safety net (same reasoning as `industry` in
-- 0001_foundation.sql): if `plan` already existed as plain text, the
-- DO block above just skips it via duplicate_column — convert it to
-- the enum type explicitly here. This is exactly the error you hit.
do $$ begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'workspaces' and column_name = 'plan') = 'text' then
    alter table public.workspaces alter column plan drop default;
    alter table public.workspaces
      alter column plan type public.workspace_plan using plan::public.workspace_plan;
    alter table public.workspaces alter column plan set default 'free'::public.workspace_plan;
    alter table public.workspaces alter column plan set not null;
  end if;
exception when others then
  raise notice 'Skipped plan type conversion: %', sqlerrm;
end $$;

-- The Phase 1 `profiles` table only let a user read their OWN profile
-- row. The team page needs to display co-workers' names, which that
-- policy would silently block (empty name, not an error) — add the
-- policy Phase 1 was missing rather than working around it in the app.
drop policy if exists "profiles_select_workspace_coworkers" on public.profiles;
create policy "profiles_select_workspace_coworkers"
  on public.profiles for select
  using (
    exists (
      select 1 from public.workspace_members wm1
      join public.workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = profiles.id and wm2.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- workspace_invitations: link-based invites. No email provider is
-- configured yet (see .env.example / CHECKLIST.md), so the invite
-- flow is "admin generates a link, shares it manually" rather than an
-- automated email send — a real, working mechanism, just not the
-- fully-automated one a configured email provider would allow.
-- ---------------------------------------------------------------------
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'agent',
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (token)
);

create index if not exists workspace_invitations_workspace_idx on public.workspace_invitations (workspace_id);

alter table public.workspace_invitations enable row level security;

-- Only admins/owners of the workspace manage invitations directly.
-- Note there is deliberately NO generic SELECT-by-anon policy here —
-- an invitee looks up their invite through the narrow function below,
-- not by querying this table, so a token can't be brute-forced via
-- table scanning even under RLS.
drop policy if exists "invitations_select_admin" on public.workspace_invitations;
create policy "invitations_select_admin"
  on public.workspace_invitations for select
  using (public.is_workspace_admin(workspace_id));

drop policy if exists "invitations_insert_admin" on public.workspace_invitations;
create policy "invitations_insert_admin"
  on public.workspace_invitations for insert
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "invitations_delete_admin" on public.workspace_invitations;
create policy "invitations_delete_admin"
  on public.workspace_invitations for delete
  using (public.is_workspace_admin(workspace_id));

-- Public/invitee-facing: look up a single invitation by its token,
-- without needing to be a workspace member. Returns nothing for an
-- expired or already-accepted invite.
create or replace function public.get_invitation_by_token(p_token uuid)
returns table (workspace_name text, role public.member_role, email text, valid boolean)
language sql
security definer
stable
set search_path = public
as $$
  select
    w.name,
    i.role,
    i.email,
    (i.accepted_at is null and i.expires_at > now()) as valid
  from public.workspace_invitations i
  join public.workspaces w on w.id = i.workspace_id
  where i.token = p_token;
$$;

revoke all on function public.get_invitation_by_token from public;
grant execute on function public.get_invitation_by_token to anon, authenticated;

-- Accept an invitation as the currently authenticated user. Validates
-- the token server-side (expiry, not-already-accepted, email match)
-- rather than trusting the client — the email match check also stops
-- someone from accepting a link meant for a different address.
create or replace function public.accept_workspace_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.workspace_invitations%rowtype;
  v_user_email text;
begin
  select * into v_invitation
  from public.workspace_invitations
  where token = p_token
  for update;

  if v_invitation.id is null then
    raise exception 'invitation_not_found';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'invitation_already_used';
  end if;
  if v_invitation.expires_at <= now() then
    raise exception 'invitation_expired';
  end if;

  select email into v_user_email from auth.users where id = auth.uid();
  if v_user_email is distinct from v_invitation.email then
    raise exception 'email_mismatch';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invitation.workspace_id, auth.uid(), v_invitation.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  update public.workspace_invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.workspace_id;
end;
$$;

revoke all on function public.accept_workspace_invitation from public;
grant execute on function public.accept_workspace_invitation to authenticated;
