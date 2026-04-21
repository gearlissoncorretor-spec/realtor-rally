-- Add reminder_enabled column to follow_ups table
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
