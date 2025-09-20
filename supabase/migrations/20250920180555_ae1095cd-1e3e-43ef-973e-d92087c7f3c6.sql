-- Create role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'corretor', 'cliente');
    END IF;
END $$;

-- Update existing users role based on is_admin flag
UPDATE public.profiles 
SET role = CASE 
    WHEN is_admin = true THEN 'admin'
    ELSE 'corretor'
END
WHERE role IS NULL OR role = 'user';

-- Update handle_new_user function to set default role based on user type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  INSERT INTO public.profiles (id, full_name, email, is_admin, role, allowed_screens)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE WHEN user_count = 0 THEN true ELSE false END,
    default_role,
    default_screens
  );
  
  RETURN NEW;
END;
$function$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role, 'cliente')
  FROM public.profiles
  WHERE id = user_id;
$function$;

-- Create function to get default screens by role
CREATE OR REPLACE FUNCTION public.get_default_screens_by_role(user_role_input TEXT)
RETURNS TEXT[]
LANGUAGE sql
STABLE
AS $function$
  SELECT CASE 
    WHEN user_role_input = 'admin' THEN 
      ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes']
    WHEN user_role_input = 'corretor' THEN 
      ARRAY['dashboard', 'vendas', 'ranking', 'acompanhamento']
    WHEN user_role_input = 'cliente' THEN 
      ARRAY['dashboard', 'vendas']
    ELSE 
      ARRAY['dashboard']
  END;
$function$;