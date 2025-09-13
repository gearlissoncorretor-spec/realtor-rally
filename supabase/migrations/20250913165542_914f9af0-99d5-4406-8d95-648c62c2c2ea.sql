-- Adicionar apenas o campo sale_type que está faltando
ALTER TABLE public.sales 
ADD COLUMN sale_type TEXT CHECK (sale_type IN ('lancamento', 'revenda')) DEFAULT 'lancamento';