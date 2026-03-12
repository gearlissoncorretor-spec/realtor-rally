-- Enable pg_cron and pg_net extensions for background push notifications
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule push notification checks every 30 minutes
SELECT cron.schedule(
  'push-notification-check',
  '*/30 * * * *',
  $$
  SELECT extensions.http((
    'POST',
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/push-notifications?action=check',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'))
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  $$
);
