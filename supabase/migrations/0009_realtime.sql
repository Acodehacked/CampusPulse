-- Scoped to exactly what's genuinely useful live: confirmation counts and
-- status changes updating while someone is already looking at an issue.
alter publication supabase_realtime add table public.issue_confirmations;
alter publication supabase_realtime add table public.issues;
