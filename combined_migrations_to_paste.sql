-- Profiles, role derivation, and the privilege-escalation guards that keep
-- role/email/department out of client control.

create type public.user_role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role public.user_role not null default 'student',
  department text,
  graduation_year integer,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application-facing user profile. role/email/department are only ever writable server-side (see handle_new_user and prevent_profile_privilege_escalation below) — never trust these fields if they ever appeared in a client payload.';

-- Derives role from CampusPulse's fixed SJCET email convention:
--   student: {name}{4-digit grad year}@{dept}.sjcetpalai.ac.in
--   admin:   {name}@{dept}.sjcetpalai.ac.in   (no trailing year digits)
-- The real access control isn't this regex — it's that Supabase Auth won't
-- let the account sign in until the confirmation link sent to that literal
-- mailbox is clicked, so "admin" still requires real access to a
-- no-digit @{dept}.sjcetpalai.ac.in inbox.
create or replace function public.derive_role_from_email(p_email text)
returns public.user_role
language sql
immutable
as $$
  select case
    when p_email ~ '^[a-z]+[0-9]{4}@(ad|cs|ec|es|cy|ce|me|eee|it)\.sjcetpalai\.ac\.in$' then 'student'::public.user_role
    when p_email ~ '^[a-z]+@(ad|cs|ec|es|cy|ce|me|eee|it)\.sjcetpalai\.ac\.in$' then 'admin'::public.user_role
    else null
  end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_match text[];
  v_department text;
  v_graduation_year integer;
begin
  v_role := public.derive_role_from_email(new.email);

  if v_role is null then
    raise exception 'Email % is not a valid SJCET student or staff address', new.email;
  end if;

  v_match := regexp_match(new.email, '^[a-z]+([0-9]{4})?@([a-z]+)\.sjcetpalai\.ac\.in$');
  v_department := v_match[2];
  v_graduation_year := nullif(v_match[1], '')::integer;

  insert into public.profiles (id, email, display_name, role, department, graduation_year)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    v_role,
    v_department,
    v_graduation_year
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so it can read profiles from inside a profiles RLS policy
-- without recursing into that same policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS's WITH CHECK can't see OLD column values, so column-level protection
-- (role/email/department are immutable to regular clients) is enforced here
-- instead. `current_user` is 'service_role' only for requests made with the
-- service-role key; every ordinary authenticated request runs as
-- 'authenticated' regardless of which end user it is.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.email is distinct from old.email
    or new.department is distinct from old.department
    or new.graduation_year is distinct from old.graduation_year then
    raise exception 'Changing role, email, or department is not permitted';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();
create type public.issue_category as enum ('network', 'hardware', 'software', 'infrastructure', 'other');
create type public.issue_priority as enum ('low', 'medium', 'high', 'critical');
create type public.issue_status as enum ('reported', 'verified', 'in_progress', 'resolved', 'rejected');

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 150),
  description text not null check (char_length(description) between 10 and 5000),
  category public.issue_category not null,
  location text not null check (char_length(location) between 2 and 150),
  priority public.issue_priority not null default 'medium',
  status public.issue_status not null default 'reported',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored
);

comment on column public.issues.resolved_at is
  'Maintained automatically by guard_issue_status_transition (0007) — set when status becomes resolved, cleared on reopen. Never set directly by application code.';

create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();
create table public.issue_confirmations (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

comment on constraint issue_confirmations_issue_id_user_id_key on public.issue_confirmations is
  'Database-enforced dedupe for "I''m affected too" — the API must not be the only thing preventing duplicates.';
create type public.issue_update_event_type as enum (
  'issue_created',
  'status_changed',
  'priority_changed',
  'admin_note_added',
  'issue_resolved',
  'issue_reopened'
);

create table public.issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type public.issue_update_event_type not null,
  old_value jsonb,
  new_value jsonb,
  message text,
  created_at timestamptz not null default now()
);

comment on table public.issue_updates is
  'Append-only activity timeline. No authenticated INSERT/UPDATE/DELETE policy exists (see 0006) — only the service-role client (used inside validated Hono service code) or SECURITY DEFINER triggers may write rows, so the timeline cannot be forged directly from the client.';
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

comment on column public.attachments.storage_path is
  'Server-generated path ({uploader_id}/{issue_id}/{random}.{ext}) — never the original filename, so it cannot collide or leak client-controlled paths into storage.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('issue-evidence', 'issue-evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
-- Row Level Security is the last line of defense: even if a Hono route had a
-- bug, these policies are what actually stop an unauthorized read or write.

alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_confirmations enable row level security;
alter table public.issue_updates enable row level security;
alter table public.attachments enable row level security;

-- profiles: display_name/avatar_url/role/department are campus-visible by
-- design (issue cards show "reported by ..."); role/email/department are
-- still immutable to the owner via the trigger in 0001, not via RLS.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- issues: anyone authenticated can read the feed; only admins may mutate
-- status/priority/etc (see also 0007's ownership-immutability trigger).
create policy "issues_select_authenticated"
  on public.issues for select
  to authenticated
  using (true);

create policy "issues_insert_own"
  on public.issues for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "issues_update_admin_only"
  on public.issues for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- issue_confirmations: students can only ever act as themselves.
create policy "confirmations_select_authenticated"
  on public.issue_confirmations for select
  to authenticated
  using (true);

create policy "confirmations_insert_own"
  on public.issue_confirmations for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "confirmations_delete_own"
  on public.issue_confirmations for delete
  to authenticated
  using (user_id = auth.uid());

-- issue_updates: read-only from the client's perspective by design.
-- Deliberately no insert/update/delete policy for `authenticated` — writes
-- only happen via the service-role client or SECURITY DEFINER triggers.
create policy "issue_updates_select_authenticated"
  on public.issue_updates for select
  to authenticated
  using (true);

-- attachments: anyone can view evidence; users can only attach to their own upload record.
create policy "attachments_select_authenticated"
  on public.attachments for select
  to authenticated
  using (true);

create policy "attachments_insert_own"
  on public.attachments for insert
  to authenticated
  with check (uploaded_by = auth.uid());

-- storage.objects for the issue-evidence bucket: path convention is
-- {uploader_id}/{issue_id}/{filename}, enforced at upload time.
create policy "storage_issue_evidence_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'issue-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_issue_evidence_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'issue-evidence');
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
create index if not exists issues_created_at_idx on public.issues (created_at desc);
create index if not exists issues_status_idx on public.issues (status);
create index if not exists issues_category_idx on public.issues (category);
create index if not exists issues_priority_idx on public.issues (priority);
create index if not exists issues_created_by_idx on public.issues (created_by);
create index if not exists issues_search_vector_idx on public.issues using gin (search_vector);

create index if not exists issue_confirmations_issue_id_idx on public.issue_confirmations (issue_id);
create index if not exists issue_confirmations_user_id_idx on public.issue_confirmations (user_id);

create index if not exists issue_updates_issue_id_created_at_idx on public.issue_updates (issue_id, created_at);

create index if not exists attachments_issue_id_idx on public.attachments (issue_id);
-- Scoped to exactly what's genuinely useful live: confirmation counts and
-- status changes updating while someone is already looking at an issue.
alter publication supabase_realtime add table public.issue_confirmations;
alter publication supabase_realtime add table public.issues;
