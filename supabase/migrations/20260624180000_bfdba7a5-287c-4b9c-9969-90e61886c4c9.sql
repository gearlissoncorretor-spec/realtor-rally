
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  default_role app_role;
  default_screens TEXT[];
  target_company_id uuid;
  is_self_signup boolean;
  new_full_name text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  target_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  is_self_signup := (target_company_id IS NULL AND (NEW.raw_user_meta_data->>'created_by_admin') IS NULL);

  new_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'configuracoes'];
  END IF;

  -- Self-signups ficam PENDENTES de aprovação e sem empresa
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved, company_id)
  VALUES (
    NEW.id,
    new_full_name,
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END,
    CASE WHEN is_self_signup THEN NULL ELSE target_company_id END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Garante que admin/sócio enxerguem cadastros pendentes sem company_id
DROP POLICY IF EXISTS "Admin and socio can view pending signups" ON public.profiles;
CREATE POLICY "Admin and socio can view pending signups"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  approved = false
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'socio')
    OR public.is_super_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin and socio can approve pending signups" ON public.profiles;
CREATE POLICY "Admin and socio can approve pending signups"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'socio')
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'socio')
  OR public.is_super_admin(auth.uid())
);
