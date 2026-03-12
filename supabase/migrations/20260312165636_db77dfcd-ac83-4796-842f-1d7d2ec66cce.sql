-- Function to get manager/director/admin user_ids (accessible to all authenticated users)
CREATE OR REPLACE FUNCTION public.get_manager_user_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(user_id), ARRAY[]::uuid[])
  FROM public.user_roles
  WHERE role IN ('gerente', 'diretor', 'admin')
$$;