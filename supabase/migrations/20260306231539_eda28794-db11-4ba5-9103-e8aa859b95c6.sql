
-- Fix organization_settings SELECT policy to restrict by company_id
DROP POLICY IF EXISTS "Todos podem visualizar configurações" ON public.organization_settings;

CREATE POLICY "Users can view own company settings"
ON public.organization_settings
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  OR is_super_admin(auth.uid())
);
