-- Fix function search path security issues
-- Set search_path for all functions that don't have it set

-- Fix existing functions to have secure search paths
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles
  WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles
  WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_allowed_screens(user_id uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(allowed_screens, ARRAY[]::TEXT[])
  FROM public.profiles
  WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(role, 'cliente')
  FROM public.profiles
  WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_count INTEGER;
  default_role TEXT;
  default_screens TEXT[];
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Set default role and screens based on user type
  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas', 'ranking', 'acompanhamento'];
  END IF;
  
  INSERT INTO public.profiles (id, full_name, email, is_admin, role, allowed_screens, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE WHEN user_count = 0 THEN true ELSE false END,
    default_role,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END -- First user is auto-approved
  );
  
  RETURN NEW;
END;
$function$;