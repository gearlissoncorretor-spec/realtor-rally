
-- Create negotiation_statuses table (persisted, like follow_up_statuses)
CREATE TABLE public.negotiation_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  icon text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.negotiation_statuses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view negotiation statuses"
  ON public.negotiation_statuses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and directors can manage negotiation statuses"
  ON public.negotiation_statuses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role));

CREATE POLICY "company_isolation"
  ON public.negotiation_statuses FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

ALTER POLICY "company_isolation" ON public.negotiation_statuses USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Auto-set company_id trigger
CREATE TRIGGER set_company_id_negotiation_statuses
  BEFORE INSERT ON public.negotiation_statuses
  FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

-- Create negotiation_notes table
CREATE TABLE public.negotiation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id uuid NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.negotiation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for accessible negotiations"
  ON public.negotiation_notes FOR SELECT TO authenticated
  USING (negotiation_id IN (SELECT id FROM public.negotiations));

CREATE POLICY "Users can insert notes for accessible negotiations"
  ON public.negotiation_notes FOR INSERT TO authenticated
  WITH CHECK (negotiation_id IN (SELECT id FROM public.negotiations));

CREATE POLICY "Users can delete own notes"
  ON public.negotiation_notes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role));

CREATE POLICY "company_isolation_notes"
  ON public.negotiation_notes FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE TRIGGER set_company_id_negotiation_notes
  BEFORE INSERT ON public.negotiation_notes
  FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
