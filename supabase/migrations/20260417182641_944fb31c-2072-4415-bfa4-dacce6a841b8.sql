-- Permitir que gerentes atualizem perfis de membros da sua equipe
CREATE POLICY "Managers can update profiles of their team members" 
ON public.profiles 
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (team_id = get_user_team_id(auth.uid()))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (team_id = get_user_team_id(auth.uid()))
);
