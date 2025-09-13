-- Adicionar campos para data da venda e tipo de venda
ALTER TABLE public.sales 
ADD COLUMN sale_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN sale_type TEXT CHECK (sale_type IN ('lancamento', 'revenda')) DEFAULT 'lancamento';