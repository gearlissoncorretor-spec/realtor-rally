-- 1. Adicionar team_id em follow_ups
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- 2. Popular team_id inicial (a partir do broker vinculado)
UPDATE public.follow_ups f
SET team_id = b.team_id
FROM public.brokers b
WHERE f.broker_id = b.id AND f.team_id IS NULL;

-- 3. Remoção de duplicidades em user_roles
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.id < b.id
  AND a.user_id = b.user_id;

-- 4. Unicidade de user_id na tabela user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 5. Configurar RLS para follow_ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "fu_view" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_insert" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_update" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_delete" ON public.follow_ups;
DROP POLICY IF EXISTS "Socios can manage all data" ON public.follow_ups;
DROP POLICY IF EXISTS "leads_select_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "leads_update_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.follow_ups;

-- Política de VISUALIZAÇÃO (SELECT)
CREATE POLICY "leads_select_policy" ON public.follow_ups
FOR SELECT TO authenticated
USING (
  (auth.uid() = created_by) OR 
  (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())) OR
  (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
  (agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid() AND (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('diretor', 'socio'))) OR
  (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('socio', 'admin')))
);

-- Política de INSERÇÃO (INSERT)
CREATE POLICY "leads_insert_policy" ON public.follow_ups
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = created_by) OR
  (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()))
);

-- Política de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "leads_update_policy" ON public.follow_ups
FOR UPDATE TO authenticated
USING (
  (auth.uid() = created_by) OR 
  (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())) OR
  (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()))
)
WITH CHECK (
  (auth.uid() = created_by) OR 
  (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()))
);

-- Política de EXCLUSÃO (DELETE)
CREATE POLICY "leads_delete_policy" ON public.follow_ups
FOR DELETE TO authenticated
USING (
  (auth.uid() = created_by) OR 
  ((SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('diretor', 'socio', 'admin'))
);
