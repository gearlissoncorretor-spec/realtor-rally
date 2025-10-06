-- Adicionar políticas RLS para diretores terem acesso total aos dados

-- Política para diretores verem todos os corretores
CREATE POLICY "Directors can view all brokers"
ON public.brokers
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
);

-- Política para diretores gerenciarem todos os corretores
CREATE POLICY "Directors can manage all brokers"
ON public.brokers
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
)
WITH CHECK (
  get_user_role(auth.uid()) = 'diretor'
);

-- Política para diretores verem todas as vendas
CREATE POLICY "Directors can view all sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
);

-- Política para diretores gerenciarem todas as vendas
CREATE POLICY "Directors can manage all sales"
ON public.sales
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
)
WITH CHECK (
  get_user_role(auth.uid()) = 'diretor'
);

-- Política para diretores verem todas as metas
CREATE POLICY "Directors can view all targets"
ON public.targets
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
);

-- Política para diretores gerenciarem todas as metas
CREATE POLICY "Directors can manage all targets"
ON public.targets
FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'diretor'
)
WITH CHECK (
  get_user_role(auth.uid()) = 'diretor'
);