
-- Fix 1: commission_rules — add restrictive company isolation
DROP POLICY IF EXISTS "company_isolation_commission_rules" ON public.commission_rules;
CREATE POLICY "company_isolation_commission_rules"
  ON public.commission_rules
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Fix 2: sticky_notes — convert company_isolation to RESTRICTIVE scoped to authenticated
DROP POLICY IF EXISTS "company_isolation" ON public.sticky_notes;
CREATE POLICY "company_isolation"
  ON public.sticky_notes
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
