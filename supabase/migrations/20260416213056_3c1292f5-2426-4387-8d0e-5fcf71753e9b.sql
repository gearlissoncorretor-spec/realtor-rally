-- 1. Update handle_new_user function to create broker record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  default_role app_role;
  default_screens TEXT[];
  target_company_id uuid;
  is_self_signup boolean;
  new_full_name text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Get company_id from metadata
  target_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  
  -- Check if this is a self-signup
  is_self_signup := (target_company_id IS NULL AND (NEW.raw_user_meta_data->>'created_by_admin') IS NULL);
  
  -- Fallback to first company ONLY if not self-signup and no company specified
  IF target_company_id IS NULL AND NOT is_self_signup THEN
    SELECT id INTO target_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
  END IF;
  
  -- Set name
  new_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'configuracoes'];
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved, company_id)
  VALUES (
    NEW.id,
    new_full_name,
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE is_self_signup END,
    target_company_id
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- IF the role is 'corretor', also ensure a broker record exists
  IF default_role = 'corretor' THEN
    INSERT INTO public.brokers (user_id, name, email, company_id, status)
    VALUES (NEW.id, new_full_name, NEW.email, target_company_id, 'ativo')
    ON CONFLICT (email) DO UPDATE 
    SET user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        company_id = COALESCE(brokers.company_id, EXCLUDED.company_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Link existing brokers that have matching emails but NULL user_id
UPDATE public.brokers b
SET user_id = p.id
FROM public.profiles p
WHERE b.user_id IS NULL 
AND b.email = p.email;

-- 3. Ensure brokers have company_id if their profiles have it
UPDATE public.brokers b
SET company_id = p.company_id
FROM public.profiles p
WHERE b.user_id = p.id 
AND b.company_id IS NULL 
AND p.company_id IS NOT NULL;

-- 4. Create a trigger to keep broker name/email synced with profiles
CREATE OR REPLACE FUNCTION public.sync_broker_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brokers
  SET name = NEW.full_name,
      email = NEW.email,
      company_id = NEW.company_id
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_update_sync_broker ON public.profiles;
CREATE TRIGGER on_profile_update_sync_broker
  AFTER UPDATE OF full_name, email, company_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_broker_from_profile();
