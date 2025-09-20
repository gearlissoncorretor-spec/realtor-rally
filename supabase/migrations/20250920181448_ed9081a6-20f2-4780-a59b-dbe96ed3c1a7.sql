-- Fix critical security vulnerability in brokers table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can create brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can update brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can delete brokers" ON public.brokers;

-- Create secure RLS policies for brokers table

-- 1. Admins can view all brokers
CREATE POLICY "Admins can view all brokers"
ON public.brokers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 2. Brokers can view only their own data
CREATE POLICY "Brokers can view their own data"
ON public.brokers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 3. Only admins can create brokers
CREATE POLICY "Only admins can create brokers"
ON public.brokers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 4. Admins can update all brokers
CREATE POLICY "Admins can update all brokers"
ON public.brokers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 5. Brokers can update only their own data (limited fields)
CREATE POLICY "Brokers can update their own data"
ON public.brokers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Only admins can delete brokers
CREATE POLICY "Only admins can delete brokers"
ON public.brokers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 7. Deny all access to anonymous users
CREATE POLICY "Deny public access to brokers"
ON public.brokers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure RLS is enabled on brokers table
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;