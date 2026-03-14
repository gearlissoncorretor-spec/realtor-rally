-- Allow month = 0 for storing annual goals independently
ALTER TABLE public.targets DROP CONSTRAINT targets_month_check;
ALTER TABLE public.targets ADD CONSTRAINT targets_month_check CHECK (month >= 0 AND month <= 12);