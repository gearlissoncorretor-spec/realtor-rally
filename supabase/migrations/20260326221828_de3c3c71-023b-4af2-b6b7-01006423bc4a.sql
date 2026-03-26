-- Adicionar coluna para tipo de parceria
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS parceria_tipo TEXT CHECK (parceria_tipo IN ('Agência', 'Mercado'));

-- Adicionar coluna para nome do vendedor na captação (quem vendeu o imóvel captado)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS vendedor_nome TEXT;

-- Garantir que a coluna 'tipo' exista e tenha um valor padrão 'venda'
ALTER TABLE public.sales ALTER COLUMN tipo SET DEFAULT 'venda';
UPDATE public.sales SET tipo = 'venda' WHERE tipo IS NULL;

-- Criar índices para melhorar a performance de busca
CREATE INDEX IF NOT EXISTS idx_sales_parceria_tipo ON public.sales(parceria_tipo);
CREATE INDEX IF NOT EXISTS idx_sales_vendedor_nome ON public.sales(vendedor_nome);