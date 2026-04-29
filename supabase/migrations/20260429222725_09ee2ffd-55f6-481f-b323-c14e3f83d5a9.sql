-- Fix security search_path for existing functions
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.get_user_company_id(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_super_admin(uuid) SET search_path = public;

-- Table for automated commission split rules
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    vendedor_percent NUMERIC DEFAULT 0,
    captador_percent NUMERIC DEFAULT 0,
    gerente_percent NUMERIC DEFAULT 0,
    agencia_percent NUMERIC DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Policies for commission_rules
CREATE POLICY "Users can view commission rules of their company" 
ON public.commission_rules FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage commission rules" 
ON public.commission_rules FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor'))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- View for Cash Flow (Lucro Real)
CREATE OR REPLACE VIEW public.vw_cash_flow AS
SELECT 
    company_id,
    due_date,
    'expense' as type,
    category,
    value * -1 as value,
    status,
    description
FROM public.financial_records
UNION ALL
SELECT 
    company_id,
    due_date,
    'income' as type,
    'Comissão' as category,
    commission_value as value,
    status,
    description
FROM public.commissions
WHERE status != 'cancelado';
