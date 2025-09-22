-- TARGETED SECURITY FIX: Address remaining vulnerabilities
-- Check and fix only what's missing

-- Ensure RLS is enabled on all tables (this is idempotent)
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the unsafe users_with_passwords view that exposes auth data
DROP VIEW IF EXISTS public.users_with_passwords;

-- Add privilege escalation prevention trigger to profiles table
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

-- Apply the privilege escalation prevention trigger to profiles
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();