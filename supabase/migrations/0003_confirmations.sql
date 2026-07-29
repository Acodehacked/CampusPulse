create table public.issue_confirmations (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

comment on constraint issue_confirmations_issue_id_user_id_key on public.issue_confirmations is
  'Database-enforced dedupe for "I''m affected too" — the API must not be the only thing preventing duplicates.';
