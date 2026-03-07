
ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS spotlight_broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL;
