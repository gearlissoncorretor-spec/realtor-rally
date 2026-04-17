-- Corrigir RLS para permitir que gerentes vejam as roles
CREATE POLICY "Managers can view roles in own company" 
ON public.user_roles 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid())))
);

-- Permitir que gerentes gerenciem roles de corretores em sua empresa
CREATE POLICY "Managers can manage broker roles in own company" 
ON public.user_roles 
FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (role = 'corretor') AND
  (user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid())))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (role = 'corretor') AND
  (user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid())))
);

-- Adicionar política de visualização para gerentes na tabela profiles se não existir
-- (Já existe prof_gerente_view mas ela é limitada por equipe, vamos expandir para empresa se necessário ou garantir que gerentes vejam sua equipe)
-- A política prof_gerente_view atual é: ((get_user_role(auth.uid()) = 'gerente'::text) AND (team_id = get_user_team_id(auth.uid())))
-- Vamos permitir que gerentes vejam todos da empresa na Gestão de Usuários, mas talvez mantendo a restrição de equipe na filtragem do frontend.
-- No entanto, para a auditoria, vamos garantir que eles vejam ao menos o que precisam.

CREATE POLICY "Managers can view all profiles in own company" 
ON public.profiles 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = 'gerente') AND 
  (company_id = get_user_company_id(auth.uid()))
);
