
-- Add team_id and created_by to targets table for team-level isolation
ALTER TABLE public.targets ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.targets ADD COLUMN IF NOT EXISTS created_by uuid;

-- RLS: Managers can only see/manage targets for their team
CREATE POLICY "Managers can view team targets"
  ON public.targets FOR SELECT
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()))
  );

CREATE POLICY "Managers can insert team targets"
  ON public.targets FOR INSERT
  TO authenticated
  WITH CHECK (
    (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()))
  );

CREATE POLICY "Managers can update team targets"
  ON public.targets FOR UPDATE
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()))
  );

CREATE POLICY "Managers can delete team targets"
  ON public.targets FOR DELETE
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()))
  );
