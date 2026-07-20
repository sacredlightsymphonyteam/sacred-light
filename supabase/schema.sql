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

-- Table-level privileges. Required because "Automatically expose new tables"
-- is OFF, so grants must be explicit. RLS (above) still governs which rows.
grant insert on public.contributions to anon, authenticated;
grant select, update on public.contributions to authenticated;

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

grant select on public.app_settings to anon, authenticated;
grant insert, update on public.app_settings to authenticated;

-- 6) Today's Light — the daily featured message (Home Section 2b) ------------
-- Angel marks one approved message as "featured" from the admin dashboard;
-- only that message appears in the homepage's Today's Light section. The
-- partial unique index guarantees at most one featured row at any time.
alter table public.contributions
  add column if not exists is_featured boolean not null default false;
alter table public.contributions
  add column if not exists featured_date date;
-- Curated rich display of the featured message (safe HTML: bold/italic/gold/
-- breaks), authored in the admin One Light editor. Optional; when null the
-- homepage falls back to the plain title/message/name.
alter table public.contributions
  add column if not exists featured_html text;

create unique index if not exists contributions_one_featured
  on public.contributions (is_featured)
  where is_featured = true;

-- Public read of the featured message — safe columns only (no email).
-- A security-definer view (default) runs with the owner's rights, so it can
-- expose just the one approved + featured row to the anon key without opening
-- up the rest of the table. If nothing is featured it returns no rows.
-- DROP + CREATE (not "create or replace"): replace can't reorder/insert view
-- columns, which errors once new columns (title, featured_html) are added.
drop view if exists public.featured_message;
create view public.featured_message as
  select id, title, message, name, location, featured_date, featured_html
  from public.contributions
  where is_featured = true and status = 'approved'
  limit 1;

grant select on public.featured_message to anon, authenticated;

-- 7) Full funnel fields (Funnel Pages brief) --------------------------------
-- The contribution form collects structured details, an optional message
-- title + display name, creative links, a newsletter opt-in, and two consent
-- flags. `name` and `location` are still populated on insert (name = display
-- name or first name, location = country) so the admin dashboard and the
-- Today's Light view keep working unchanged.
alter table public.contributions
  add column if not exists salutation        text,
  add column if not exists first_name        text,
  add column if not exists last_name         text,
  add column if not exists country           text,
  add column if not exists city              text,
  add column if not exists website           text,
  add column if not exists social            text,
  add column if not exists title             text,
  add column if not exists display_name      text,
  add column if not exists signature         text,
  add column if not exists music_url         text,
  add column if not exists video_url         text,
  add column if not exists newsletter_opt_in boolean not null default false,
  add column if not exists consent_original  boolean not null default false,
  add column if not exists consent_publish   boolean not null default false;

-- 8) Language + translation (form-language addition) ------------------------
-- `language` is the language the form was completed in; `display_language` is
-- how the contributor wants their message presented in the Book. consent_
-- translate records permission to translate the message for the Book.
alter table public.contributions
  add column if not exists language          text,
  add column if not exists display_language  text,
  add column if not exists consent_translate boolean not null default false;

-- 9) Credits — Our Gratitude tiers (The Circle, Section 6) -------------------
-- Modular, admin-editable. Each row is one name within a tier; tiers are
-- implied by tier_name/tier_slug/tier_order (denormalised per the brief).
-- is_placeholder marks the "To be announced." line for an empty tier.
create table if not exists public.credits (
  id             uuid primary key default gen_random_uuid(),
  tier_name      text not null,
  tier_slug      text not null,
  tier_order     integer not null default 0,
  name           text not null,
  role           text,
  is_visible     boolean not null default true,
  is_placeholder boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.credits enable row level security;

drop policy if exists "anyone reads visible credits" on public.credits;
create policy "anyone reads visible credits"
  on public.credits for select to public using (is_visible = true);

drop policy if exists "admins manage credits" on public.credits;
create policy "admins manage credits"
  on public.credits for all to authenticated using (true) with check (true);

-- Explicit grants (project has "expose new tables" OFF; RLS still governs rows).
grant select on public.credits to anon, authenticated;
grant insert, update, delete on public.credits to authenticated;

-- Seed the approved launch content — only if the table is empty (idempotent).
insert into public.credits (tier_name, tier_slug, tier_order, name, role, is_placeholder)
select v.tier_name, v.tier_slug, v.tier_order, v.name, v.role, v.is_placeholder
from (values
  ('Founding Voices', 'founding-voices', 1, 'Bob Gruen', 'Photographer', false),
  ('Founding Voices', 'founding-voices', 1, 'Rob Verhorst', 'Photographer', false),
  ('Founding Voices', 'founding-voices', 1, 'Markus Ernst', 'Mayor of Küsnacht', false),
  ('Creative Collaborators', 'creative-collaborators', 2, 'Serena Russignan & Mike Sommer', null, false),
  ('Artists of Light', 'artists-of-light', 3, 'Sharon Davson', 'Guardian of the Book of Gratitude', false),
  ('Founding Partners', 'founding-partners', 4, 'To be announced.', null, true)
) as v(tier_name, tier_slug, tier_order, name, role, is_placeholder)
where not exists (select 1 from public.credits);

-- New table added → refresh the API schema cache.
notify pgrst, 'reload schema';

-- 10) Harden anon to least privilege ----------------------------------------
-- On projects where new tables are auto-exposed to anon, the anon role may get
-- broad table privileges by default. RLS still governs rows, but strip anything
-- anon doesn't need so it can ONLY insert a contribution and read public data.
revoke all on public.contributions from anon;
grant insert on public.contributions to anon;

revoke all on public.credits from anon;
grant select on public.credits to anon;

revoke all on public.app_settings from anon;
grant select on public.app_settings to anon;

notify pgrst, 'reload schema';

-- 11) Transactional email webhook (Brevo via send-email Edge Function) --------
-- Fires the `send-email` Edge Function on every insert/update of a contribution.
-- The function inspects the payload and decides which email to send:
--   INSERT                     → "message received" (+ newsletter opt-in)
--   UPDATE status → 'approved' → "light confirmed"
--   UPDATE status → 'rejected' → "gentle decline"
-- Any other change is a no-op. This mirrors what a dashboard Database Webhook
-- would create; done in SQL so it is version-controlled and reproducible.
--
-- Prerequisites (one-time, per project — NOT created by this file):
--   • Deploy the function:  supabase/functions/send-email  (Verify JWT = OFF)
--   • Set its secrets:      BREVO_API_KEY, WEBHOOK_SECRET
--   • Replace YOUR-PROJECT-REF below, and set the x-webhook-secret header value
--     to the SAME string as the function's WEBHOOK_SECRET secret.
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_send_email()
returns trigger language plpgsql security definer as $$
begin
  perform net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'REPLACE-WITH-WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'type',       TG_OP,                       -- 'INSERT' or 'UPDATE'
      'table',      TG_TABLE_NAME,
      'schema',     TG_TABLE_SCHEMA,
      'record',     to_jsonb(NEW),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_send_email on public.contributions;
create trigger trg_send_email
  after insert or update on public.contributions
  for each row execute function public.notify_send_email();
