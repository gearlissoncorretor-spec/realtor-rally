-- Remove development artifacts and secure system settings

-- 1. Update system_settings RLS policy to admin-only access
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.system_settings;

CREATE POLICY "Admins can view settings" ON public.system_settings
FOR SELECT 
USING (get_current_user_admin_status() = true);

-- 2. Remove dev_password column from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS dev_password;

-- 3. Remove admin default password from system_settings
DELETE FROM public.system_settings 
WHERE key = 'admin_password';