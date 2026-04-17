-- Remove the failing cron job that used extensions.http
SELECT cron.unschedule('push-notification-check');
