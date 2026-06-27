-- DeadlineDesk — Pro feature columns
-- Run after 0001_init.sql. Paste into the Supabase SQL editor and Run.

-- profiles: calendar feed token + extra reminder recipients
alter table profiles
  add column if not exists calendar_token uuid not null default gen_random_uuid(),
  add column if not exists cc_recipients text[] not null default '{}';

-- One token per user; calendar apps authenticate with it in the feed URL.
create unique index if not exists profiles_calendar_token_idx
  on profiles (calendar_token);

-- deadlines: completion audit trail + snooze override flag
alter table deadlines
  add column if not exists completed_at timestamptz,
  add column if not exists completion_note text,
  -- When true, the rules engine will NOT overwrite this deadline's due_date
  -- (set when a landlord snoozes/reschedules it).
  add column if not exists due_date_overridden boolean not null default false;
