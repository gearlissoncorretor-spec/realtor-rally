-- Ensure RLS is enabled (should already be)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Replace restrictive policy to include admins as well as directors
DROP POLICY IF EXISTS "Directors can manage all teams" ON public.teams;

CREATE POLICY "Admins and Directors can manage teams"
ON public.teams
FOR ALL
USING (
  public.get_current_user_admin_status() = true
  OR public.get_user_role(auth.uid()) = 'diretor'
)
WITH CHECK (
  public.get_current_user_admin_status() = true
  OR public.get_user_role(auth.uid()) = 'diretor'
);

-- Keep existing SELECT policies as-is (Managers can view their team, All authenticated users can view teams)

-- Ensure updated_at is refreshed on updates
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();