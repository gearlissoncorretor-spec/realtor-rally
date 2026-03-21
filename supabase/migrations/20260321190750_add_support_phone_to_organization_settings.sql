-- Add support phone to organization settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS support_phone text;
