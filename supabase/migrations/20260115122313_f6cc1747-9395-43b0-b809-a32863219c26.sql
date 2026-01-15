-- Drop existing INSERT policy for goals
DROP POLICY IF EXISTS "Directors and managers can create goals" ON public.goals;

-- Create new INSERT policy that allows directors/managers/admins to create goals
CREATE POLICY "Directors and managers can create goals" 
ON public.goals 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Admins can create any goals
  get_current_user_admin_status() = true
  OR
  -- Directors can create any goals
  get_user_role(auth.uid()) = 'diretor'
  OR
  -- Managers can create goals for their team or unassigned
  (
    get_user_role(auth.uid()) = 'gerente' 
    AND (
      team_id IS NULL 
      OR team_id IN (SELECT profiles.team_id FROM profiles WHERE profiles.id = auth.uid())
    )
  )
);

-- Also update the UPDATE policy to allow managers to update their team's goals
DROP POLICY IF EXISTS "Directors and managers can update goals" ON public.goals;

CREATE POLICY "Directors and managers can update goals" 
ON public.goals 
FOR UPDATE 
TO authenticated
USING (
  get_current_user_admin_status() = true
  OR get_user_role(auth.uid()) = 'diretor'
  OR (
    get_user_role(auth.uid()) = 'gerente' 
    AND (
      team_id IS NULL 
      OR team_id IN (SELECT profiles.team_id FROM profiles WHERE profiles.id = auth.uid())
    )
  )
  OR assigned_to = auth.uid()
)
WITH CHECK (
  get_current_user_admin_status() = true
  OR get_user_role(auth.uid()) = 'diretor'
  OR (
    get_user_role(auth.uid()) = 'gerente' 
    AND (
      team_id IS NULL 
      OR team_id IN (SELECT profiles.team_id FROM profiles WHERE profiles.id = auth.uid())
    )
  )
  OR assigned_to = auth.uid()
);

-- Update DELETE policy similarly
DROP POLICY IF EXISTS "Directors and managers can delete goals" ON public.goals;

CREATE POLICY "Directors and managers can delete goals" 
ON public.goals 
FOR DELETE 
TO authenticated
USING (
  get_current_user_admin_status() = true
  OR get_user_role(auth.uid()) = 'diretor'
  OR (
    get_user_role(auth.uid()) = 'gerente' 
    AND (
      team_id IS NULL 
      OR team_id IN (SELECT profiles.team_id FROM profiles WHERE profiles.id = auth.uid())
    )
  )
);