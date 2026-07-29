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
