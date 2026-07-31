-- =====================================================================
-- SocialSales OS — Phase 2: CRM (notes, activities, follow-ups)
-- =====================================================================

-- ---------------------------------------------------------------------
-- lead_notes: free-text notes an agent leaves on a lead.
-- ---------------------------------------------------------------------
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

alter table public.lead_notes enable row level security;

create policy "lead_notes_select_member"
  on public.lead_notes for select
  using (public.is_workspace_member(workspace_id));

create policy "lead_notes_insert_member"
  on public.lead_notes for insert
  with check (public.is_workspace_member(workspace_id) and author_id = auth.uid());

create policy "lead_notes_delete_author_or_admin"
  on public.lead_notes for delete
  using (author_id = auth.uid() or public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------
-- lead_activities: system-generated timeline (status changes,
-- assignment changes, follow-up completions). Written by triggers,
-- never directly by the client.
-- ---------------------------------------------------------------------
create type public.activity_type as enum (
  'created', 'status_changed', 'assigned', 'note_added', 'follow_up_completed'
);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  type public.activity_type not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);

alter table public.lead_activities enable row level security;

create policy "lead_activities_select_member"
  on public.lead_activities for select
  using (public.is_workspace_member(workspace_id));

-- No insert policy for lead_activities: rows are written exclusively by
-- SECURITY DEFINER trigger functions below, not directly by clients.

-- ---------------------------------------------------------------------
-- lead_follow_ups: scheduled follow-up tasks per lead.
-- ---------------------------------------------------------------------
create table public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  due_at timestamptz not null,
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index lead_follow_ups_due_idx on public.lead_follow_ups (workspace_id, due_at) where completed_at is null;

alter table public.lead_follow_ups enable row level security;

create policy "follow_ups_select_member"
  on public.lead_follow_ups for select
  using (public.is_workspace_member(workspace_id));

create policy "follow_ups_insert_member"
  on public.lead_follow_ups for insert
  with check (public.is_workspace_member(workspace_id));

create policy "follow_ups_update_member"
  on public.lead_follow_ups for update
  using (public.is_workspace_member(workspace_id));

create policy "follow_ups_delete_admin"
  on public.lead_follow_ups for delete
  using (public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------
-- Triggers: auto-log activity on lead creation / status change / reassignment.
-- ---------------------------------------------------------------------
create function public.log_lead_created()
returns trigger as $$
begin
  insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
  values (new.id, new.workspace_id, auth.uid(), 'created', jsonb_build_object('source', new.source));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_lead_created
  after insert on public.leads
  for each row execute procedure public.log_lead_created();

create function public.log_lead_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
    values (new.id, new.workspace_id, auth.uid(), 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
    values (new.id, new.workspace_id, auth.uid(), 'assigned',
            jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to));
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_lead_updated_log
  after update on public.leads
  for each row execute procedure public.log_lead_status_change();

create function public.log_note_added()
returns trigger as $$
begin
  insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
  values (new.lead_id, new.workspace_id, new.author_id, 'note_added', '{}');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_note_added_log
  after insert on public.lead_notes
  for each row execute procedure public.log_note_added();

create function public.log_follow_up_completed()
returns trigger as $$
begin
  if new.completed_at is not null and old.completed_at is null then
    insert into public.lead_activities (lead_id, workspace_id, actor_id, type, payload)
    values (new.lead_id, new.workspace_id, auth.uid(), 'follow_up_completed', '{}');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_follow_up_completed_log
  after update on public.lead_follow_ups
  for each row execute procedure public.log_follow_up_completed();

-- ---------------------------------------------------------------------
-- Full-text search over leads (name, phone, email) for the search box.
-- ---------------------------------------------------------------------
alter table public.leads add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, ''))
  ) stored;

create index leads_search_idx on public.leads using gin (search_vector);
