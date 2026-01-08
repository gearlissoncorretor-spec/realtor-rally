-- Add distrato to sale_status enum
ALTER TYPE public.sale_status ADD VALUE IF NOT EXISTS 'distrato';

-- Add created_by column to brokers table to track who created each broker
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update RLS policies for brokers to allow managers to delete only their own created brokers
DROP POLICY IF EXISTS "Managers can delete their created brokers" ON public.brokers;

CREATE POLICY "Managers can delete their created brokers"
ON public.brokers
FOR DELETE
USING (
  (get_user_role(auth.uid()) = 'gerente' AND created_by = auth.uid())
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
);