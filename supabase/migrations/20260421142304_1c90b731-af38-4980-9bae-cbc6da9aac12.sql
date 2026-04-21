-- Create financial_records table
CREATE TABLE public.financial_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    value NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, atrasado
    category TEXT NOT NULL, -- Marketing, Operacional, Comissão, Outros
    payment_method TEXT,
    observations TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID NOT NULL,
    agency_id UUID,
    commission_id UUID REFERENCES public.commissions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Policies for financial_records

-- Restrictive policy for company isolation (applied to everyone)
CREATE POLICY "company_isolation_financial"
ON public.financial_records
FOR ALL
TO authenticated
USING (company_id = get_user_company_id(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Individual access policy
CREATE POLICY "Users can manage own financial records" 
ON public.financial_records 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Manager access policy
CREATE POLICY "Managers can view team financial records"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
    get_user_role(auth.uid()) = 'gerente' 
    AND user_id IN (
        SELECT id FROM profiles WHERE team_id = get_user_team_id(auth.uid())
    )
);

-- Director/Admin access policy
CREATE POLICY "Directors and Admins can manage all financial records"
ON public.financial_records
FOR ALL
TO authenticated
USING (
    get_user_role(auth.uid()) IN ('diretor', 'socio', 'admin')
    OR get_current_user_admin_status() = true
)
WITH CHECK (
    get_user_role(auth.uid()) IN ('diretor', 'socio', 'admin')
    OR get_current_user_admin_status() = true
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_records_updated_at
BEFORE UPDATE ON public.financial_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
