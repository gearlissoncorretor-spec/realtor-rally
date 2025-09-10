-- Primeiro, vamos adicionar os novos campos obrigatórios na tabela sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS origem text,
ADD COLUMN IF NOT EXISTS estilo text,
ADD COLUMN IF NOT EXISTS produto text,
ADD COLUMN IF NOT EXISTS vendedor text,
ADD COLUMN IF NOT EXISTS captador text,
ADD COLUMN IF NOT EXISTS gerente text,
ADD COLUMN IF NOT EXISTS pagos numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ano integer,
ADD COLUMN IF NOT EXISTS mes integer,
ADD COLUMN IF NOT EXISTS latitude text;

-- Corrigir as políticas RLS para permitir inserção sem autenticação (para o contexto atual)
DROP POLICY IF EXISTS "Authenticated users can insert brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can update brokers" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can delete brokers" ON public.brokers;

CREATE POLICY "Allow all operations on brokers" 
ON public.brokers 
FOR ALL 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;

CREATE POLICY "Allow all operations on sales" 
ON public.sales 
FOR ALL 
USING (true)
WITH CHECK (true);