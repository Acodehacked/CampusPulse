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
