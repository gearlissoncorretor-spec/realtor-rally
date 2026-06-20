
-- 1) Cost centers table
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  agency_id uuid,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT ALL ON public.cost_centers TO service_role;

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_centers_select_company"
  ON public.cost_centers FOR SELECT
  TO authenticated
  USING (company_id = public.get_my_company_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "cost_centers_insert_managers"
  ON public.cost_centers FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin','socio','diretor','super_admin')
  );

CREATE POLICY "cost_centers_update_managers"
  ON public.cost_centers FOR UPDATE
  TO authenticated
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin','socio','diretor','super_admin')
  );

CREATE POLICY "cost_centers_delete_managers"
  ON public.cost_centers FOR DELETE
  TO authenticated
  USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('admin','socio','super_admin')
  );

CREATE TRIGGER cost_centers_set_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS cost_centers_company_idx ON public.cost_centers(company_id);

-- 2) Extend financial_records
ALTER TABLE public.financial_records
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'despesa',
  ADD COLUMN IF NOT EXISTS party_name text,
  ADD COLUMN IF NOT EXISTS party_document text,
  ADD COLUMN IF NOT EXISTS paid_date date,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring boolean NOT NULL DEFAULT false;

-- Ensure type is constrained
DO $$ BEGIN
  ALTER TABLE public.financial_records
    ADD CONSTRAINT financial_records_type_chk CHECK (type IN ('receita','despesa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS financial_records_type_idx ON public.financial_records(type);
CREATE INDEX IF NOT EXISTS financial_records_company_due_idx ON public.financial_records(company_id, due_date);
