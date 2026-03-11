
DROP POLICY IF EXISTS "Managers can delete their created brokers" ON public.brokers;

CREATE POLICY "Managers can delete team brokers"
ON public.brokers
FOR DELETE
TO public
USING (
  ((get_user_role(auth.uid()) = 'gerente'::text) AND (team_id = get_user_team_id(auth.uid())))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
);
