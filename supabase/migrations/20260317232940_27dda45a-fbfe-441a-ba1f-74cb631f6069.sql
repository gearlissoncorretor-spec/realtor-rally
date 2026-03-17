
-- Table for granular per-screen permissions (RBAC matrix)
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL,
  screen text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, role, screen)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Company isolation (restrictive)
CREATE POLICY "company_isolation" ON public.role_permissions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Admins and directors can manage permissions
CREATE POLICY "Admins and directors manage permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor') OR is_super_admin(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor') OR is_super_admin(auth.uid()));

-- All authenticated users can read permissions (needed for access checks)
CREATE POLICY "Users can view permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Auto-set company_id trigger
CREATE TRIGGER set_company_id_role_permissions
  BEFORE INSERT ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_company_id();

-- Updated_at trigger
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
