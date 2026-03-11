
-- Allow diretores to also insert/update organization_settings
DROP POLICY IF EXISTS "Apenas admins podem atualizar configurações" ON public.organization_settings;
DROP POLICY IF EXISTS "Apenas admins podem inserir configurações" ON public.organization_settings;

CREATE POLICY "Admins and directors can update settings"
ON public.organization_settings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role));

CREATE POLICY "Admins and directors can insert settings"
ON public.organization_settings FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role));
