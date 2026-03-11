
-- Add logo_url column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url text;

-- Allow managers to update their own team's logo
CREATE POLICY "Managers can update own team"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'gerente') 
  AND (id = get_user_team_id(auth.uid()))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente') 
  AND (id = get_user_team_id(auth.uid()))
);

-- Allow managers to view their own team
CREATE POLICY "Managers can view own team"
ON public.teams
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'gerente') 
  AND (id = get_user_team_id(auth.uid()))
);
