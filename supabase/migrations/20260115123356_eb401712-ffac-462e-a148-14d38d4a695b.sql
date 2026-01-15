-- Add period_type column to broker_weekly_activities table
ALTER TABLE public.broker_weekly_activities 
ADD COLUMN IF NOT EXISTS period_type TEXT NOT NULL DEFAULT 'weekly' 
CHECK (period_type IN ('daily', 'weekly', 'monthly'));