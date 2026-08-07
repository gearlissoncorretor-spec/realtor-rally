ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_id uuid REFERENCES public.follow_ups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_first_contact_at ON public.leads (first_contact_at);