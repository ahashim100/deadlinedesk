-- DeadlineDesk — initial schema
-- Postgres / Supabase. Run via `supabase db push` or paste into the SQL editor.
--
-- Design notes:
--  * Each landlord is an auth.users row. A matching `profiles` row holds plan +
--    notification preferences and is auto-created by a trigger on signup.
--  * Ownership chains: properties.user_id -> units.property_id -> leases.unit_id
--    -> deadlines.lease_id -> reminder_log.deadline_id.
--  * Row-Level Security restricts every row to its owning landlord. The daily
--    reminder Edge Function uses the service-role key, which bypasses RLS so it
--    can scan every user's deadlines.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type deadline_type as enum (
  'lease_renewal',
  'rent_increase_notice',
  'deposit_return',
  'inspection',
  'insurance_renewal',
  'license_renewal'
);

create type deadline_status as enum ('upcoming', 'done', 'dismissed');

create type deadline_source as enum ('rule', 'manual');

create type reminder_channel as enum ('email', 'sms');

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text,
  -- Billing (synced from Stripe webhook)
  stripe_customer_id    text,
  stripe_subscription_id text,
  -- 'inactive' until Stripe reports an active/trialing subscription.
  subscription_status   text not null default 'inactive',
  -- Notification preferences
  notify_email          boolean not null default true,
  notify_sms            boolean not null default false,
  phone                 text,
  -- Days-before-due that reminders fire. Defaults to 60/30/7/1.
  lead_times            integer[] not null default '{60,30,7,1}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table properties (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  nickname    text not null,
  address     text,
  state       text not null default 'CA',
  created_at  timestamptz not null default now()
);
create index properties_user_id_idx on properties (user_id);

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------
create table units (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties (id) on delete cascade,
  unit_label   text not null default 'Unit 1',
  created_at   timestamptz not null default now()
);
create index units_property_id_idx on units (property_id);

-- ---------------------------------------------------------------------------
-- leases
-- ---------------------------------------------------------------------------
create table leases (
  id                        uuid primary key default gen_random_uuid(),
  unit_id                   uuid not null references units (id) on delete cascade,
  tenant_name               text,
  tenant_email              text,
  lease_start               date,
  lease_end                 date,
  monthly_rent              numeric(12,2),
  deposit_amount            numeric(12,2),
  move_out_date             date,
  rent_increase_notice_days integer,
  license_renewal_date      date,
  insurance_renewal_date    date,
  inspection_date           date,
  created_at                timestamptz not null default now()
);
create index leases_unit_id_idx on leases (unit_id);

-- ---------------------------------------------------------------------------
-- deadlines
-- ---------------------------------------------------------------------------
create table deadlines (
  id          uuid primary key default gen_random_uuid(),
  lease_id    uuid not null references leases (id) on delete cascade,
  type        deadline_type not null,
  due_date    date not null,
  status      deadline_status not null default 'upcoming',
  source      deadline_source not null default 'rule',
  created_at  timestamptz not null default now()
);
create index deadlines_lease_id_idx on deadlines (lease_id);
create index deadlines_due_date_idx on deadlines (due_date);

-- A lease can only have one rule-derived deadline of a given type; re-running
-- the rules engine upserts onto this constraint instead of duplicating.
-- Manual deadlines are exempt (a landlord may add several of the same type).
create unique index deadlines_rule_unique
  on deadlines (lease_id, type)
  where source = 'rule';

-- ---------------------------------------------------------------------------
-- reminder_log
-- ---------------------------------------------------------------------------
create table reminder_log (
  id          uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references deadlines (id) on delete cascade,
  channel     reminder_channel not null,
  -- Which lead-time bucket (days before due) this send covers. Lets us send
  -- distinct 60/30/7/1-day reminders without re-sending the same one.
  lead_time   integer not null,
  sent_at     timestamptz not null default now(),
  status      text not null default 'sent'
);
create index reminder_log_deadline_id_idx on reminder_log (deadline_id);

-- Guards against double-sending the same lead-time reminder on the same channel.
create unique index reminder_log_unique
  on reminder_log (deadline_id, channel, lead_time);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep profiles.updated_at fresh
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table profiles     enable row level security;
alter table properties   enable row level security;
alter table units        enable row level security;
alter table leases       enable row level security;
alter table deadlines    enable row level security;
alter table reminder_log enable row level security;

-- profiles: a user can see/update only their own row.
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- properties: owned directly via user_id.
create policy "properties_all_own" on properties
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- units: owned via parent property.
create policy "units_all_own" on units
  for all using (
    exists (
      select 1 from properties p
      where p.id = units.property_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from properties p
      where p.id = units.property_id and p.user_id = auth.uid()
    )
  );

-- leases: owned via unit -> property.
create policy "leases_all_own" on leases
  for all using (
    exists (
      select 1 from units u
      join properties p on p.id = u.property_id
      where u.id = leases.unit_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from units u
      join properties p on p.id = u.property_id
      where u.id = leases.unit_id and p.user_id = auth.uid()
    )
  );

-- deadlines: owned via lease -> unit -> property.
create policy "deadlines_all_own" on deadlines
  for all using (
    exists (
      select 1 from leases l
      join units u on u.id = l.unit_id
      join properties p on p.id = u.property_id
      where l.id = deadlines.lease_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from leases l
      join units u on u.id = l.unit_id
      join properties p on p.id = u.property_id
      where l.id = deadlines.lease_id and p.user_id = auth.uid()
    )
  );

-- reminder_log: read-only to owner (writes happen via service role in the
-- Edge Function, which bypasses RLS).
create policy "reminder_log_select_own" on reminder_log
  for select using (
    exists (
      select 1 from deadlines d
      join leases l on l.id = d.lease_id
      join units u on u.id = l.unit_id
      join properties p on p.id = u.property_id
      where d.id = reminder_log.deadline_id and p.user_id = auth.uid()
    )
  );
