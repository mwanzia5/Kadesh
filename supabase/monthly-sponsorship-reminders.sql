-- Monthly sponsorship reminder emails.
-- Run once in Supabase > SQL Editor AFTER deploying the
-- monthly-sponsorship-reminders function and setting its CRON_SECRET.
-- Replace PASTE_CRON_SECRET_HERE below with the same secret first.
BEGIN;

-- 1) Log of reminders already sent (one per donor, month and kind), so
--    nobody is emailed twice. Only the server can read or write it.
CREATE TABLE IF NOT EXISTS public.sponsorship_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
  kind text NOT NULL CHECK (kind IN ('due', 'overdue')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (donor_id, month, kind)
);
ALTER TABLE public.sponsorship_reminder_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sponsorship_reminder_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.sponsorship_reminder_log TO service_role;

COMMIT;

-- 2) Daily schedule (06:00 UTC = 9:00 AM in Kenya/Uganda). Each donor still
--    gets at most one email per month; the daily run just catches anyone
--    whose payment becomes due or overdue, and spreads large batches out.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid) FROM cron.job
  WHERE jobname = 'monthly-sponsorship-reminders';

SELECT cron.schedule(
  'monthly-sponsorship-reminders',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://trzmdofcpoqhtvwsjsqq.supabase.co/functions/v1/monthly-sponsorship-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'PASTE_CRON_SECRET_HERE'
    ),
    body := '{}'::jsonb
  );
  $$
);
