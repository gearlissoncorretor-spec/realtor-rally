-- Permitir que gerentes criem corretores na sua equipe
DROP POLICY IF EXISTS "Managers can create brokers in their team" ON public.brokers;

CREATE POLICY "Managers can create brokers in their team"
ON public.brokers
FOR INSERT
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente' 
   AND team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
);

-- Garantir que gerentes podem ver e gerenciar seus corretores
DROP POLICY IF EXISTS "Managers can view their team brokers" ON public.brokers;
DROP POLICY IF EXISTS "Managers can manage their team brokers" ON public.brokers;

CREATE POLICY "Managers can view their team brokers"
ON public.brokers
FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente' 
   AND team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
  OR user_id = auth.uid()
);

CREATE POLICY "Managers can update their team brokers"
ON public.brokers
FOR UPDATE
USING (
  (get_user_role(auth.uid()) = 'gerente' 
   AND team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()))
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
  OR user_id = auth.uid()
);

-- Permitir que service role (edge functions) crie brokers
DROP POLICY IF EXISTS "Service role can insert brokers" ON public.brokers;

CREATE POLICY "Service role can insert brokers"
ON public.brokers
FOR INSERT
WITH CHECK (true);