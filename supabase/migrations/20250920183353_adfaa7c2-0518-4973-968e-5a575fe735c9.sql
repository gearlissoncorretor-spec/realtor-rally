-- Temporarily disable RLS for development (REMOVE IN PRODUCTION)
-- This allows unrestricted access to all tables for testing

-- Disable RLS on all tables temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

-- Add password field to profiles for development visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dev_password text;

-- Create a view to show user passwords for development
CREATE OR REPLACE VIEW public.users_with_passwords AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_admin,
  p.approved,
  p.dev_password,
  p.created_at,
  au.encrypted_password,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;