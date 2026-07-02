
-- 1) Consolidate brokers RLS
DROP POLICY IF EXISTS "Admins can update brokers in their company" ON public.brokers;
DROP POLICY IF EXISTS "Admins can view brokers in their company" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can update their own data" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can view their own data" ON public.brokers;
DROP POLICY IF EXISTS "Directors can manage all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Directors can view all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Socios can manage all data" ON public.brokers;
DROP POLICY IF EXISTS "agency_isolation" ON public.brokers;
DROP POLICY IF EXISTS "brk_admin_delete" ON public.brokers;
DROP POLICY IF EXISTS "brk_admin_insert" ON public.brokers;
DROP POLICY IF EXISTS "brk_mgr_delete" ON public.brokers;
DROP POLICY IF EXISTS "brk_mgr_insert" ON public.brokers;
DROP POLICY IF EXISTS "brk_mgr_update" ON public.brokers;
DROP POLICY IF EXISTS "brk_mgr_view" ON public.brokers;
DROP POLICY IF EXISTS "company_isolation" ON public.brokers;

CREATE POLICY "brokers_select" ON public.brokers FOR SELECT TO authenticated USING (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.get_user_role(auth.uid()) IN ('admin','socio','diretor')
      OR (public.get_user_role(auth.uid()) = 'gerente' AND team_id = public.get_user_team_id(auth.uid()))
      OR user_id = auth.uid()
    )
  )
);

CREATE POLICY "brokers_insert" ON public.brokers FOR INSERT TO authenticated WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
    AND (
      public.get_user_role(auth.uid()) IN ('admin','socio','diretor')
      OR (public.get_user_role(auth.uid()) = 'gerente' AND (team_id IS NULL OR team_id = public.get_user_team_id(auth.uid())))
    )
  )
);

CREATE POLICY "brokers_update" ON public.brokers FOR UPDATE TO authenticated USING (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.get_user_role(auth.uid()) IN ('admin','socio','diretor')
      OR (public.get_user_role(auth.uid()) = 'gerente' AND team_id = public.get_user_team_id(auth.uid()))
      OR user_id = auth.uid()
    )
  )
) WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.get_user_role(auth.uid()) IN ('admin','socio','diretor')
      OR (public.get_user_role(auth.uid()) = 'gerente' AND team_id = public.get_user_team_id(auth.uid()))
      OR user_id = auth.uid()
    )
  )
);

CREATE POLICY "brokers_delete" ON public.brokers FOR DELETE TO authenticated USING (
  public.is_super_admin(auth.uid())
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND public.get_user_role(auth.uid()) IN ('admin','socio','diretor')
  )
);

-- 2) Performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_tipo_date ON public.sales(tipo, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_broker_date ON public.sales(broker_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_broker_status ON public.negotiations(broker_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_next_contact_null ON public.follow_ups(company_id) WHERE next_contact_date IS NULL;
