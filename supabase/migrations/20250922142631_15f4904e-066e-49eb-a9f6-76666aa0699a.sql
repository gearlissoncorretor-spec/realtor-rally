-- Remove development artifacts and secure system settings (updated)

-- 1. Update system_settings RLS policy to admin-only access
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;

-- The "Admins can view settings" policy already exists, so we don't need to recreate it

-- 2. Remove dev_password column from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS dev_password;

-- 3. Remove admin default password from system_settings
DELETE FROM public.system_settings 
WHERE key = 'admin_password';