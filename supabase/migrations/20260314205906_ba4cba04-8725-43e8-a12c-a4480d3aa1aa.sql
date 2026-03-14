
CREATE TABLE public.commission_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  due_date date,
  payment_date date,
  status text NOT NULL DEFAULT 'pendente',
  payment_method text,
  observations text,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(commission_id, installment_number)
);

ALTER TABLE public.commission_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own installments" ON public.commission_installments
  FOR SELECT TO authenticated
  USING (commission_id IN (
    SELECT c.id FROM public.commissions c
    WHERE c.broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
  ));

CREATE POLICY "Directors and admins manage installments" ON public.commission_installments
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true)
  WITH CHECK (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true);

CREATE POLICY "Managers manage team installments" ON public.commission_installments
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) = 'gerente' AND commission_id IN (
      SELECT c.id FROM public.commissions c
      WHERE c.broker_id IN (SELECT b.id FROM public.brokers b WHERE b.team_id = get_user_team_id(auth.uid()))
    )
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'gerente' AND commission_id IN (
      SELECT c.id FROM public.commissions c
      WHERE c.broker_id IN (SELECT b.id FROM public.brokers b WHERE b.team_id = get_user_team_id(auth.uid()))
    )
  );

CREATE POLICY "company_isolation" ON public.commission_installments
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE TRIGGER set_commission_installments_company_id
  BEFORE INSERT ON public.commission_installments
  FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER update_commission_installments_updated_at
  BEFORE UPDATE ON public.commission_installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
