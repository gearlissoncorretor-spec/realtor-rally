
-- Create a security definer function to get user's team_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = _user_id
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;

-- Recreate it using the security definer function
CREATE POLICY "Managers can view team profiles"
ON public.profiles
FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text)
  AND (team_id = get_user_team_id(auth.uid()))
);
