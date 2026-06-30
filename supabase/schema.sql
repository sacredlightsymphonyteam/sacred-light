-- Sacred Light Symphony — Book of Gratitude backend
-- Run this once in the Supabase dashboard → SQL Editor.
--
-- It creates the contributions table, locks it down with RLS so the public
-- (anon) key can ONLY insert pending messages — never read or approve them —
-- and a private Storage bucket for optional uploads.

-- 1) Contributions table -----------------------------------------------------
create table if not exists public.gratitude_contributions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  message     text not null,
  name        text not null,
  email       text not null,
  location    text,
  file_path   text,
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected'))
);

-- 2) Force every public insert to 'pending' (moderation happens later, by you).
--    Even if a crafted request sets status, this trigger overrides it.
create or replace function public.force_pending_status()
returns trigger language plpgsql as $$
begin
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists trg_force_pending on public.gratitude_contributions;
create trigger trg_force_pending
  before insert on public.gratitude_contributions
  for each row execute function public.force_pending_status();

-- 3) Row Level Security ------------------------------------------------------
alter table public.gratitude_contributions enable row level security;

-- Grant the Data API roles INSERT on the table. Required because "Automatically
-- expose new tables" is OFF — privileges must be granted manually. RLS (below)
-- still governs WHICH rows they may add; SELECT is deliberately NOT granted, so
-- messages stay private until moderated server-side.
grant insert on public.gratitude_contributions to anon, authenticated;

-- Anyone (anon) may submit a contribution...
drop policy if exists "anon can submit" on public.gratitude_contributions;
create policy "anon can submit"
  on public.gratitude_contributions
  for insert to anon, authenticated
  with check (true);

-- ...but NO public select/update/delete. Reading & moderating is done with the
-- service role (server side / dashboard), so messages stay private until approved.

-- 4) Storage bucket for optional uploads (private) ---------------------------
insert into storage.buckets (id, name, public)
values ('gratitude-uploads', 'gratitude-uploads', false)
on conflict (id) do nothing;

-- Anon may upload into the bucket; they cannot list or read it back.
drop policy if exists "anon can upload" on storage.objects;
create policy "anon can upload"
  on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'gratitude-uploads');
