-- Drop existing restrictive policies for admin/director that require broker_id
DROP POLICY IF EXISTS "Admins can manage all targets" ON public.targets;
DROP POLICY IF EXISTS "Directors can manage all targets" ON public.targets;

-- Create new policies that allow admin/directors to manage ALL targets including those without broker_id
CREATE POLICY "Admins can manage all targets" 
ON public.targets 
FOR ALL 
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

CREATE POLICY "Directors can manage all targets" 
ON public.targets 
FOR ALL 
USING (get_user_role(auth.uid()) = 'diretor')
WITH CHECK (get_user_role(auth.uid()) = 'diretor');

-- Add policy for managers to create/manage global targets (without broker_id)
CREATE POLICY "Managers can manage global targets" 
ON public.targets 
FOR ALL 
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IS NULL
)
WITH CHECK (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IS NULL
);