
-- Add secondary_color to organization_settings
ALTER TABLE public.organization_settings 
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#10b981';
