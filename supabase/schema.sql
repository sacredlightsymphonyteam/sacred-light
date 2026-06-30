-- Sacred Light Symphony — Book of Gratitude backend
-- Run this once in the Supabase dashboard → SQL Editor. Safe to re-run.
--
-- Public (anon) may ONLY insert pending messages — never read them. Logged-in
-- admins (the moderation page) can read and approve/reject. Approving auto-
-- assigns a sequential star_id (one star per approved message → Phase 2).

-- 1) Contributions ----------------------------------------------------------
create table if not exists public.contributions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  message     text not null,
  name        text not null,
  email       text not null,
  location    text,
  attachments text[] not null default '{}',
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected')),
  star_id     bigint unique,           -- assigned on first approval (see trigger)
  in_book     boolean not null default false
);

create index if not exists contributions_status_idx on public.contributions (status);

-- 2) Assign a sequential star_id the first time a row becomes approved -------
create or replace function public.assign_star_id()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and new.star_id is null then
    select coalesce(max(star_id), 0) + 1 into new.star_id from public.contributions;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_star_id on public.contributions;
create trigger trg_assign_star_id
  before update on public.contributions
  for each row execute function public.assign_star_id();

-- 3) Row Level Security ------------------------------------------------------
alter table public.contributions enable row level security;

-- Public may submit only pending rows (and may never set a star_id).
drop policy if exists "anon can submit" on public.contributions;
create policy "anon can submit"
  on public.contributions for insert to public
  with check (status = 'pending' and star_id is null);

-- Logged-in admins can read and moderate everything.
drop policy if exists "admins can read" on public.contributions;
create policy "admins can read"
  on public.contributions for select to authenticated using (true);

drop policy if exists "admins can update" on public.contributions;
create policy "admins can update"
  on public.contributions for update to authenticated using (true) with check (true);

-- 4) Storage bucket for uploads ---------------------------------------------
-- Public-read so approved artwork can appear in the book/constellation; file
-- names are random + unguessable. Anyone may upload (the form does).
insert into storage.buckets (id, name, public)
values ('gratitude-uploads', 'gratitude-uploads', true)
on conflict (id) do nothing;
-- If the bucket already existed (e.g. created private earlier), make it public:
update storage.buckets set public = true where id = 'gratitude-uploads';

drop policy if exists "anon can upload" on storage.objects;
create policy "anon can upload"
  on storage.objects for insert to public
  with check (bucket_id = 'gratitude-uploads');

-- 5) Editable app settings (admin-managed, e.g. Heyzine URL) ----------------
create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value) values ('heyzine_url', '')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "anyone can read settings" on public.app_settings;
create policy "anyone can read settings"
  on public.app_settings for select to public using (true);

drop policy if exists "admins manage settings" on public.app_settings;
create policy "admins manage settings"
  on public.app_settings for all to authenticated using (true) with check (true);
