-- First let's check the current structure and update it properly
-- Drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

-- Update role column to allow our values
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;

-- Update existing users role based on is_admin flag
UPDATE public.profiles 
SET role = CASE 
    WHEN is_admin = true THEN 'admin'
    ELSE 'corretor'
END;

-- Add constraint for valid roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'corretor', 'cliente'));

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