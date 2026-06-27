-- Track which subscription tier (free / base / pro) each profile is on.
-- Also stores the Stripe price_id so the webhook can map price → tier.

alter table profiles
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists stripe_price_id   text;

-- Backfill: anyone currently active goes to 'base' (single plan before this split).
update profiles
set subscription_tier = 'base'
where subscription_status in ('active', 'trialing');
