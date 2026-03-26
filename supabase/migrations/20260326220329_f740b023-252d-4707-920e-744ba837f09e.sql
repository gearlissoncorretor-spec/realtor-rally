-- Add is_partnership column to sales table
ALTER TABLE public.sales ADD COLUMN is_partnership BOOLEAN DEFAULT false;

-- Update RLS policies (usually not needed for just a new column if they use SELECT *)
-- but good to keep in mind.
