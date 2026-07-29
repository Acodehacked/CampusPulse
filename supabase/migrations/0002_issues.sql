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
