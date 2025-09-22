-- CRITICAL SECURITY FIX: Enable RLS and create secure policies
-- This migration addresses the critical security vulnerabilities identified

-- First, enable RLS on all tables that currently don't have it
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
-- Note: profiles already has RLS enabled

-- Drop the unsafe users_with_passwords view that exposes auth data
DROP VIEW IF EXISTS public.users_with_passwords;

-- Create secure default deny-all policies for public access protection
CREATE POLICY "Deny public access to brokers" 
ON public.brokers 
FOR ALL 
TO public 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Deny public access to sales" 
ON public.sales 
FOR ALL 
TO public 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Deny public access to targets" 
ON public.targets 
FOR ALL 
TO public 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Deny public access to system_settings" 
ON public.system_settings 
FOR ALL 
TO public 
USING (false) 
WITH CHECK (false);

-- BROKERS TABLE: Secure policies
-- Admins can view all brokers
CREATE POLICY "Admins can view all brokers" 
ON public.brokers 
FOR SELECT 
TO authenticated
USING (get_current_user_admin_status() = true);

-- Brokers can view their own data
CREATE POLICY "Brokers can view their own data" 
ON public.brokers 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Only admins can create brokers
CREATE POLICY "Only admins can create brokers" 
ON public.brokers 
FOR INSERT 
TO authenticated
WITH CHECK (get_current_user_admin_status() = true);

-- Admins can update all brokers
CREATE POLICY "Admins can update all brokers" 
ON public.brokers 
FOR UPDATE 
TO authenticated
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

-- Brokers can update their own data (but not user_id)
CREATE POLICY "Brokers can update their own data" 
ON public.brokers 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only admins can delete brokers
CREATE POLICY "Only admins can delete brokers" 
ON public.brokers 
FOR DELETE 
TO authenticated
USING (get_current_user_admin_status() = true);

-- SALES TABLE: Secure policies
-- Admins can view all sales
CREATE POLICY "Admins can view all sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (get_current_user_admin_status() = true);

-- Brokers can view their own sales
CREATE POLICY "Brokers can view their own sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Admins can manage all sales
CREATE POLICY "Admins can manage all sales" 
ON public.sales 
FOR ALL 
TO authenticated
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

-- Brokers can manage their own sales
CREATE POLICY "Brokers can manage their own sales" 
ON public.sales 
FOR ALL 
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
))
WITH CHECK (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- TARGETS TABLE: Secure policies
-- Admins can view all targets
CREATE POLICY "Admins can view all targets" 
ON public.targets 
FOR SELECT 
TO authenticated
USING (get_current_user_admin_status() = true);

-- Brokers can view their own targets
CREATE POLICY "Brokers can view their own targets" 
ON public.targets 
FOR SELECT 
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Admins can manage all targets
CREATE POLICY "Admins can manage all targets" 
ON public.targets 
FOR ALL 
TO authenticated
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

-- Brokers can insert their own targets
CREATE POLICY "Brokers can insert their own targets" 
ON public.targets 
FOR INSERT 
TO authenticated
WITH CHECK (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Brokers can update their own targets
CREATE POLICY "Brokers can update their own targets" 
ON public.targets 
FOR UPDATE 
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
))
WITH CHECK (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Brokers can delete their own targets
CREATE POLICY "Brokers can delete their own targets" 
ON public.targets 
FOR DELETE 
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- SYSTEM_SETTINGS TABLE: Secure policies
-- Authenticated users can view settings
CREATE POLICY "Authenticated users can view settings" 
ON public.system_settings 
FOR SELECT 
TO authenticated
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings" 
ON public.system_settings 
FOR ALL 
TO authenticated
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

-- Create secure trigger to prevent privilege escalation in profiles
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent non-admins from changing admin status or role
  IF NOT get_current_user_admin_status() AND (
    OLD.is_admin != NEW.is_admin OR 
    OLD.role != NEW.role OR
    OLD.approved != NEW.approved OR
    OLD.allowed_screens != NEW.allowed_screens
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify admin status, role, approval, or allowed screens';
  END IF;
  
  -- Prevent users from changing other users' profiles
  IF auth.uid() != NEW.id AND NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;