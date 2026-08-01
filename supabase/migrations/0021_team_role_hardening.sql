-- =====================================================================
-- SocialSales OS — Phase 21: Team role-escalation hardening
-- =====================================================================
-- CRITICAL FINDING (production audit): the existing RLS policies
-- (members_update_admin / members_delete_admin, 0001_foundation.sql)
-- let ANY admin update or delete ANY workspace_members row, with no
-- restriction on the new role value. Combined with the app-layer
-- actions (team/actions.ts), this meant:
--   1. An admin could call updateMemberRoleAction(their own user_id,
--      'owner') and grant themselves owner status.
--   2. An admin could demote or remove the real owner outright.
--   3. An admin could invite a new member directly as 'owner'
--      (workspace_invitations had no role restriction either).
-- All three are full workspace takeover paths. The app-layer fix
-- (team/actions.ts) gives users a clean error message, but the actual
-- security boundary belongs here, in triggers on the tables — the
-- same principle the rest of this schema follows (RLS/DB enforces
-- tenant isolation, not application code).
-- ---------------------------------------------------------------------

create or replace function public.prevent_owner_role_tampering()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'owner' and exists (
      select 1 from public.workspace_members
      where workspace_id = new.workspace_id and role = 'owner'
    ) then
      raise exception 'workspace_already_has_owner';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.role = 'owner' and new.role is distinct from old.role then
      raise exception 'cannot_change_owner_role';
    end if;
    if new.role = 'owner' and old.role is distinct from new.role then
      raise exception 'cannot_grant_owner_role';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.role = 'owner' then
      raise exception 'cannot_remove_owner';
    end if;
    return old;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- Runs on every insert/update/delete against workspace_members,
-- regardless of which role or client performed it (including the
-- service-role/admin client), because trigger execution is not
-- gated by RLS — this is the actual enforcement point.
drop trigger if exists workspace_members_protect_owner on public.workspace_members;
create trigger workspace_members_protect_owner
  before insert or update or delete on public.workspace_members
  for each row execute procedure public.prevent_owner_role_tampering();

-- ---------------------------------------------------------------------
-- Close the second path: an admin inviting a new member directly as
-- 'owner' (or 'admin', which is also a meaningful escalation an
-- ordinary admin shouldn't be able to hand out solo). Only the current
-- owner may issue an invite for 'owner' or 'admin'; other admins may
-- only invite plain 'agent' members.
-- ---------------------------------------------------------------------
create or replace function public.check_invitation_role()
returns trigger as $$
declare
  v_inviter_role public.member_role;
begin
  select role into v_inviter_role
  from public.workspace_members
  where workspace_id = new.workspace_id and user_id = auth.uid();

  if new.role in ('owner', 'admin') and v_inviter_role is distinct from 'owner' then
    raise exception 'only_owner_can_grant_this_role';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists workspace_invitations_check_role on public.workspace_invitations;
create trigger workspace_invitations_check_role
  before insert on public.workspace_invitations
  for each row execute procedure public.check_invitation_role();
