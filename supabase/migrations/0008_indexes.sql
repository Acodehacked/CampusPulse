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
