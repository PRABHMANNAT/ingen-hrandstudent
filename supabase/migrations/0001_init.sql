-- ============================================================================
-- Phase 0 schema: accounts, profiles, dynamic sections/items, proofs, chat.
-- Run this in the Supabase SQL editor (or `supabase db push`) once your
-- project exists. Idempotent-ish: safe to re-run after a clean reset.
-- ============================================================================

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('student', 'recruiter');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_status as enum ('verified', 'partial', 'unverified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_kind as enum ('github', 'doi', 'image', 'link', 'file');
exception when duplicate_object then null; end $$;

-- Profiles (one row per auth user) -------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.app_role not null default 'student',
  full_name   text not null default '',
  email       text,
  headline    text not null default '',
  about       text not null default '',
  tags        text[] not null default '{}',
  avatar_url  text,
  target_role text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Dynamic profile sections (education, projects, research, hackathons, ...) ---
create table if not exists public.sections (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists sections_profile_idx on public.sections(profile_id);

-- Items within a section -----------------------------------------------------
create table if not exists public.items (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  meta       jsonb not null default '{}'::jsonb,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists items_section_idx on public.items(section_id);

-- Proof attached to an item (github repo, DOI, cert image, file, link) -------
create table if not exists public.proofs (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  kind       public.proof_kind not null,
  url        text,
  file_path  text,
  status     public.proof_status not null default 'unverified',
  confidence numeric not null default 0,
  extracted  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists proofs_item_idx on public.proofs(item_id);

-- Aristotle chat history (private to owner) ----------------------------------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists chat_profile_idx on public.chat_messages(profile_id);

-- ============================================================================
-- Row Level Security
--   * Authenticated users can READ any profile/section/item/proof (recruiters
--     need to view candidate profiles).
--   * Users can WRITE only their own rows.
--   * Chat is fully private to its owner.
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.sections      enable row level security;
alter table public.items         enable row level security;
alter table public.proofs        enable row level security;
alter table public.chat_messages enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_write_own on public.profiles;
create policy profiles_write_own on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- sections (owned via profile_id = auth.uid())
drop policy if exists sections_read on public.sections;
create policy sections_read on public.sections for select to authenticated using (true);
drop policy if exists sections_write_own on public.sections;
create policy sections_write_own on public.sections for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- items (owned via parent section)
drop policy if exists items_read on public.items;
create policy items_read on public.items for select to authenticated using (true);
drop policy if exists items_write_own on public.items;
create policy items_write_own on public.items for all to authenticated
  using (exists (select 1 from public.sections s where s.id = items.section_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.sections s where s.id = items.section_id and s.profile_id = auth.uid()));

-- proofs (owned via item -> section)
drop policy if exists proofs_read on public.proofs;
create policy proofs_read on public.proofs for select to authenticated using (true);
drop policy if exists proofs_write_own on public.proofs;
create policy proofs_write_own on public.proofs for all to authenticated
  using (exists (
    select 1 from public.items i join public.sections s on s.id = i.section_id
    where i.id = proofs.item_id and s.profile_id = auth.uid()))
  with check (exists (
    select 1 from public.items i join public.sections s on s.id = i.section_id
    where i.id = proofs.item_id and s.profile_id = auth.uid()));

-- chat_messages (private)
drop policy if exists chat_own on public.chat_messages;
create policy chat_own on public.chat_messages for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up. Role + name come
-- from the signup metadata (set by the login page / OAuth).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep updated_at fresh on profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Storage bucket for uploaded media (avatars, certificates, event photos).
-- Files are namespaced per-user: `<auth.uid()>/...`.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select
  using (bucket_id = 'profile-media');

drop policy if exists media_own_insert on storage.objects;
create policy media_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists media_own_update on storage.objects;
create policy media_own_update on storage.objects for update to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists media_own_delete on storage.objects;
create policy media_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
