-- Fix critical infinite recursion in profiles table RLS policies
-- Create security definer function to safely check admin status
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false)
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON public.profiles;

-- Create secure RLS policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_current_user_admin_status() = true);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.get_current_user_admin_status() = true)
WITH CHECK (public.get_current_user_admin_status() = true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix system_settings table - remove public access
DROP POLICY IF EXISTS "Everyone can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.system_settings;

CREATE POLICY "Authenticated users can view settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.get_current_user_admin_status() = true)
WITH CHECK (public.get_current_user_admin_status() = true);

-- Fix targets table - implement proper role-based access
DROP POLICY IF EXISTS "Everyone can view targets" ON public.targets;
DROP POLICY IF EXISTS "Authenticated users can manage targets" ON public.targets;

CREATE POLICY "Admins can view all targets"
ON public.targets
FOR SELECT
TO authenticated
USING (public.get_current_user_admin_status() = true);

CREATE POLICY "Brokers can view their own targets"
ON public.targets
FOR SELECT
TO authenticated
USING (
  broker_id IN (
    SELECT brokers.id 
    FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all targets"
ON public.targets
FOR ALL
TO authenticated
USING (public.get_current_user_admin_status() = true)
WITH CHECK (public.get_current_user_admin_status() = true);

CREATE POLICY "Brokers can insert their own targets"
ON public.targets
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id IN (
    SELECT brokers.id 
    FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update their own targets"
ON public.targets
FOR UPDATE
TO authenticated
USING (
  broker_id IN (
    SELECT brokers.id 
    FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
)
WITH CHECK (
  broker_id IN (
    SELECT brokers.id 
    FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete their own targets"
ON public.targets
FOR DELETE
TO authenticated
USING (
  broker_id IN (
    SELECT brokers.id 
    FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

-- Create admin password configuration
INSERT INTO public.system_settings (key, value, description) 
VALUES (
  'admin_default_password', 
  '"admin123"',
  'Default password for admin users'
) ON CONFLICT (key) DO NOTHING;

-- Create user approval system setting
INSERT INTO public.system_settings (key, value, description) 
VALUES (
  'require_user_approval', 
  'true',
  'Require manual approval for new user accounts'
) ON CONFLICT (key) DO NOTHING;

-- Add user approval status to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;