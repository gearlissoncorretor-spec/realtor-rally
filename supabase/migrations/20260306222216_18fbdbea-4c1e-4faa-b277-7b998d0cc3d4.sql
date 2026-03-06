
-- Fix get_user_primary_role to prioritize super_admin
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text
      WHEN 'super_admin' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'diretor' THEN 2
      WHEN 'gerente' THEN 3
      WHEN 'corretor' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;
