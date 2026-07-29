-- Status transition rules, kept in sync with constants/status-transitions.ts.
-- The TS map produces friendly inline errors before a request is ever sent;
-- this is the backstop that makes an invalid transition impossible even if
-- application code has a bug.
create or replace function public.is_valid_issue_status_transition(p_old public.issue_status, p_new public.issue_status)
returns boolean
language sql
immutable
as $$
  select case
    when p_old = p_new then true
    when p_old = 'reported' and p_new in ('verified', 'rejected') then true
    when p_old = 'verified' and p_new in ('in_progress', 'rejected') then true
    when p_old = 'in_progress' and p_new in ('resolved', 'rejected') then true
    when p_old = 'resolved' and p_new = 'in_progress' then true
    when p_old = 'rejected' and p_new = 'reported' then true
    else false
  end;
$$;

create or replace function public.guard_issue_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
    and not public.is_valid_issue_status_transition(old.status, new.status) then
    raise exception 'Invalid issue status transition from % to %', old.status, new.status;
  end if;

  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    new.resolved_at = now();
  elsif new.status is distinct from 'resolved' and old.status = 'resolved' then
    new.resolved_at = null;
  end if;

  return new;
end;
$$;

create trigger issues_guard_status_transition
  before update on public.issues
  for each row execute function public.guard_issue_status_transition();

-- No feature ever needs to reassign an issue to a different reporter — block
-- it outright so a bug elsewhere can't quietly rewrite ownership.
create or replace function public.prevent_issue_reassignment()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Changing issue ownership is not permitted';
  end if;
  return new;
end;
$$;

create trigger issues_prevent_reassignment
  before update on public.issues
  for each row execute function public.prevent_issue_reassignment();

-- Every issue gets its "issue_created" timeline entry automatically — this
-- can't be skipped by a bug in the create-issue service path. Later timeline
-- entries (status/priority changes, notes, resolve/reopen) are written
-- explicitly by admin-service.ts via the service-role client, since those
-- need an admin-authored message.
create or replace function public.log_issue_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.issue_updates (issue_id, actor_id, event_type, new_value, message)
  values (
    new.id,
    new.created_by,
    'issue_created',
    jsonb_build_object('status', new.status, 'priority', new.priority, 'category', new.category),
    'Issue reported'
  );
  return new;
end;
$$;

create trigger issues_log_created
  after insert on public.issues
  for each row execute function public.log_issue_created();
