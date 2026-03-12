
-- Allow gerentes to also update and insert organization_settings (for spotlight broker)
DROP POLICY IF EXISTS "Admins and directors can update settings" ON public.organization_settings;
CREATE POLICY "Admins directors and managers can update settings"
  ON public.organization_settings
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'diretor'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'diretor'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
  );

DROP POLICY IF EXISTS "Admins and directors can insert settings" ON public.organization_settings;
CREATE POLICY "Admins directors and managers can insert settings"
  ON public.organization_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'diretor'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
  );
