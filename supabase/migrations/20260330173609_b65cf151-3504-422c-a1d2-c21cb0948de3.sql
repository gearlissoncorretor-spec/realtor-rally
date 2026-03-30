
-- Add company_id column to audit_logs if not exists
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Add company_isolation RESTRICTIVE policy to audit_logs
CREATE POLICY "company_isolation_audit_logs"
  ON public.audit_logs
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
  )
  WITH CHECK (
    (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
  );

-- Allow inserting audit logs (for the log_audit_event function)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-set company_id on audit_logs
CREATE TRIGGER set_audit_logs_company_id
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_company_id();
