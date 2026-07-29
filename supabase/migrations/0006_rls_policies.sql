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
