-- Fix critical security vulnerability in sales table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
DROP POLICY IF EXISTS "Everyone can view sales" ON public.sales;

-- Create secure RLS policies for sales table

-- 1. Admins can view all sales
CREATE POLICY "Admins can view all sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 2. Brokers can only view their own sales
CREATE POLICY "Brokers can view their own sales"
ON public.sales
FOR SELECT  
TO authenticated
USING (
  broker_id IN (
    SELECT brokers.id FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

-- 3. Admins can insert/update/delete all sales
CREATE POLICY "Admins can manage all sales"
ON public.sales
FOR ALL
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

-- 4. Brokers can insert/update/delete only their own sales
CREATE POLICY "Brokers can manage their own sales"
ON public.sales
FOR ALL
TO authenticated
USING (
  broker_id IN (
    SELECT brokers.id FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
)
WITH CHECK (
  broker_id IN (
    SELECT brokers.id FROM public.brokers 
    WHERE brokers.user_id = auth.uid()
  )
);

-- 5. Ensure only authenticated users can access sales (no public access)
-- This policy denies all access to unauthenticated users
CREATE POLICY "Deny public access to sales"
ON public.sales
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also ensure RLS is enabled on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;