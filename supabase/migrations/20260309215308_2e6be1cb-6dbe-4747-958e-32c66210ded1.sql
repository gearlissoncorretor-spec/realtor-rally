
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;

SELECT cron.schedule(
  'check-push-notifications',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kwsnnwiwflsvsqiuzfja.supabase.co/functions/v1/push-notifications?action=check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c25ud2l3ZmxzdnNxaXV6ZmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjUxNzYsImV4cCI6MjA3Mjg0MTE3Nn0._wkwx1DF3dU3prxTZ-w1jANj4uJS1u1tXzN4D4bq5wY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
