-- Adiciona coluna support_phone na tabela organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS support_phone text;

-- Garante que as permissões de RLS estejam corretas (se necessário)
-- Já deve haver RLS, mas vamos conferir se o perfil admin pode atualizar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_settings' AND policyname = 'Admins can update organization settings'
  ) THEN
    CREATE POLICY "Admins can update organization settings" 
    ON public.organization_settings 
    FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'diretor')));
  END IF;
END $$;