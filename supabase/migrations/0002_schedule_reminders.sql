-- Schedule the daily reminder Edge Function with pg_cron + pg_net.
--
-- HOW TO USE:
--   1. Deploy the function first:  supabase functions deploy daily-reminders
--   2. In the Supabase SQL editor, replace the two placeholders below:
--        <PROJECT_REF>      e.g. abcdefghijklmno  (Project Settings → General)
--        <SERVICE_ROLE_KEY> Project Settings → API → service_role key
--      Prefer storing the key in Vault rather than inline — see the note below.
--   3. Run this file.
--
-- Runs every day at 13:00 UTC (~6am PT). Adjust the cron expression as needed.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove a previous schedule with the same name, if any.
select cron.unschedule('daily-reminders')
where exists (select 1 from cron.job where jobname = 'daily-reminders');

select cron.schedule(
  'daily-reminders',
  '0 13 * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- SECURITY NOTE: hard-coding the service-role key in a cron job is convenient
-- but not ideal. To use Vault instead:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
-- then read it inside the job with:
--   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
