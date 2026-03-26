-- Add missing fields to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS longitude TEXT,
ADD COLUMN IF NOT EXISTS unidade TEXT,
ADD COLUMN IF NOT EXISTS bloco TEXT;

-- Update negotiations table to include location and unit info as well for consistency
ALTER TABLE public.negotiations
ADD COLUMN IF NOT EXISTS latitude TEXT,
ADD COLUMN IF NOT EXISTS longitude TEXT,
ADD COLUMN IF NOT EXISTS unidade TEXT,
ADD COLUMN IF NOT EXISTS bloco TEXT;
