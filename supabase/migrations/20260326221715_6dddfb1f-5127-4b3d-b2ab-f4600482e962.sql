-- Adicionar coluna para tipo de parceria
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS parceria_tipo TEXT CHECK (parceria_tipo IN ('Agência', 'Mercado'));

-- Adicionar coluna para nome do vendedor na captação (se não existir ou se preferir separar)
-- O campo 'vendedor' já existe, mas vamos garantir que ele seja usado para o 'Nome de quem vendeu'
-- Caso o usuário prefira um campo novo, usamos vendedor_nome.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS vendedor_nome TEXT;

-- Garantir que a coluna 'tipo' exista e tenha um valor padrão
ALTER TABLE public.sales ALTER COLUMN tipo SET DEFAULT 'venda';
UPDATE public.sales SET tipo = 'venda' WHERE tipo IS NULL;
