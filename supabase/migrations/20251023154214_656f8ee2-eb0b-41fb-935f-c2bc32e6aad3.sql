-- CRITICAL SECURITY FIX: Move roles to separate table to prevent privilege escalation
-- This migration creates a secure role system with proper RLS policies

-- 1. Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'diretor', 'gerente', 'corretor', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text
      WHEN 'admin' THEN 1
      WHEN 'diretor' THEN 2
      WHEN 'gerente' THEN 3
      WHEN 'corretor' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;

-- 6. Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;

-- 7. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id,
  CASE 
    WHEN is_admin = true THEN 'admin'::app_role
    WHEN role = 'diretor' THEN 'diretor'::app_role
    WHEN role = 'gerente' THEN 'gerente'::app_role
    WHEN role = 'corretor' THEN 'corretor'::app_role
    ELSE 'user'::app_role
  END,
  created_at
FROM public.profiles
WHERE id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Create RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9. Update get_user_role function to use new table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_primary_role(user_id)
$$;

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 11. Update handle_new_user trigger to use new role system
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
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Set default role and screens based on user type
  IF user_count = 0 THEN
    default_role := 'diretor';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas'];
  END IF;
  
  -- Insert into profiles (without role and is_admin)
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role);
  
  RETURN NEW;
END;
$$;

-- 12. Update prevent_privilege_escalation trigger to protect role changes
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent non-admins from changing approval or allowed screens
  IF NOT get_current_user_admin_status() AND (
    OLD.approved != NEW.approved OR
    OLD.allowed_screens != NEW.allowed_screens
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify approval or allowed screens';
  END IF;
  
  -- Prevent users from changing other users' profiles  
  IF auth.uid() != NEW.id AND NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 13. Add comment explaining the security model
COMMENT ON TABLE public.user_roles IS 'Stores user roles separately from profiles to prevent privilege escalation attacks. Always use has_role() function in RLS policies.';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles. Prevents RLS recursion and privilege escalation.';
