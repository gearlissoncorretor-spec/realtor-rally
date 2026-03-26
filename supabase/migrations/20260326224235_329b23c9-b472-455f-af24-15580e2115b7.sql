-- Adicionar colunas para contato e CRECI do vendedor na captação
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS vendedor_telefone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS vendedor_creci TEXT;

-- Criar índices para melhorar a performance de busca
CREATE INDEX IF NOT EXISTS idx_sales_vendedor_telefone ON public.sales(vendedor_telefone);
CREATE INDEX IF NOT EXISTS idx_sales_vendedor_creci ON public.sales(vendedor_creci);