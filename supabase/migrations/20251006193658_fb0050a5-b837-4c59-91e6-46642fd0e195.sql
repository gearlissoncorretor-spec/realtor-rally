-- Adicionar políticas RLS para gerentes visualizarem apenas dados da sua equipe

-- Política para gerentes verem corretores da sua equipe
CREATE POLICY "Managers can view their team brokers"
ON public.brokers
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND team_id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política para gerentes gerenciarem corretores da sua equipe
CREATE POLICY "Managers can manage their team brokers"
ON public.brokers
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND team_id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'gerente' 
  AND team_id IN (
    SELECT team_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política para gerentes verem vendas da sua equipe
CREATE POLICY "Managers can view their team sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);

-- Política para gerentes gerenciarem vendas da sua equipe
CREATE POLICY "Managers can manage their team sales"
ON public.sales
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);

-- Política para gerentes verem metas da sua equipe
CREATE POLICY "Managers can view their team targets"
ON public.targets
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);

-- Política para gerentes gerenciarem metas da sua equipe
CREATE POLICY "Managers can manage their team targets"
ON public.targets
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM public.brokers b
    INNER JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);