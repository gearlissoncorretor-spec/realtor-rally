
-- Directors can view all profiles (needed for team management, user lists, etc.)
CREATE POLICY "Directors can view all profiles"
ON public.profiles
FOR SELECT
USING (get_user_role(auth.uid()) = 'diretor'::text);

-- Directors can update profiles (needed for managing team assignments, approvals, etc.)
CREATE POLICY "Directors can update all profiles"
ON public.profiles
FOR UPDATE
USING (get_user_role(auth.uid()) = 'diretor'::text)
WITH CHECK (get_user_role(auth.uid()) = 'diretor'::text);

-- Directors can view all user roles (needed for user management visibility)
CREATE POLICY "Directors can view all roles"
ON public.user_roles
FOR SELECT
USING (get_user_role(auth.uid()) = 'diretor'::text);

-- Directors can manage user roles (needed for role assignments)
CREATE POLICY "Directors can manage all roles"
ON public.user_roles
FOR ALL
USING (get_user_role(auth.uid()) = 'diretor'::text)
WITH CHECK (get_user_role(auth.uid()) = 'diretor'::text);

-- Managers should also be able to view profiles of their team members
CREATE POLICY "Managers can view team profiles"
ON public.profiles
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'gerente'::text 
  AND team_id IN (
    SELECT p.team_id FROM profiles p WHERE p.id = auth.uid()
  )
);
