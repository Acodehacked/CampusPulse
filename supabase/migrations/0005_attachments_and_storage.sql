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
