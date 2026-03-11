
-- Create commissions table
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  
  -- Commission values
  commission_percentage numeric NOT NULL DEFAULT 5,
  commission_value numeric NOT NULL DEFAULT 0,
  base_value numeric NOT NULL DEFAULT 0,
  
  -- Payment tracking
  status text NOT NULL DEFAULT 'pendente',
  payment_date date,
  payment_method text,
  installments integer DEFAULT 1,
  paid_installments integer DEFAULT 0,
  
  -- Additional info
  observations text,
  
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Auto-set company_id
CREATE TRIGGER set_commission_company_id
  BEFORE INSERT ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

-- Update updated_at
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Company isolation
CREATE POLICY "company_isolation" ON public.commissions
  FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Directors and admins can manage all
CREATE POLICY "Directors and admins can manage commissions" ON public.commissions
  FOR ALL TO authenticated
  USING ((get_user_role(auth.uid()) = 'diretor') OR (get_current_user_admin_status() = true))
  WITH CHECK ((get_user_role(auth.uid()) = 'diretor') OR (get_current_user_admin_status() = true));

-- Managers can manage team commissions
CREATE POLICY "Managers can manage team commissions" ON public.commissions
  FOR ALL TO authenticated
  USING ((get_user_role(auth.uid()) = 'gerente') AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  WITH CHECK ((get_user_role(auth.uid()) = 'gerente') AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )));

-- Brokers can view their own commissions
CREATE POLICY "Brokers can view own commissions" ON public.commissions
  FOR SELECT TO authenticated
  USING (broker_id IN (
    SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()
  ));
