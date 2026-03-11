
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS show_in_ranking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_tv boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unit_label text DEFAULT NULL;
