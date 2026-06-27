-- Schedule the weekly digest Edge Function with pg_cron + pg_net.
--
-- Prereqs: deploy the function first:  supabase functions deploy weekly-digest
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> as in 0002_schedule_reminders.sql.
--
-- Runs every Monday at 13:30 UTC (~6:30am PT).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('weekly-digest')
where exists (select 1 from cron.job where jobname = 'weekly-digest');

select cron.schedule(
  'weekly-digest',
  '30 13 * * 1',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
