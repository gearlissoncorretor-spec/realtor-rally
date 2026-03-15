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
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Get company_id from metadata (set by admin/super_admin during creation)
  target_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  
  -- Check if this is a self-signup (no company_id in metadata)
  is_self_signup := (target_company_id IS NULL AND (NEW.raw_user_meta_data->>'created_by_admin') IS NULL);
  
  -- Fallback to first company ONLY if not self-signup and no company specified
  IF target_company_id IS NULL AND NOT is_self_signup THEN
    SELECT id INTO target_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
  END IF;
  
  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas'];
  END IF;
  
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE is_self_signup END,
    target_company_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;