
-- Update admin@gmail.com role from 'admin' to 'super_admin'
UPDATE public.user_roles 
SET role = 'super_admin'
WHERE user_id = 'b5ea9fc2-60db-4df2-afba-2ed23bc689da' AND role = 'admin';

-- If no row was updated (maybe role doesn't exist yet), insert it
INSERT INTO public.user_roles (user_id, role)
VALUES ('b5ea9fc2-60db-4df2-afba-2ed23bc689da', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
