-- 1. Fix leaky profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles in their company" 
ON public.profiles FOR SELECT 
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "prof_diretor_view" ON public.profiles;
CREATE POLICY "Directors can view all profiles in their company" 
ON public.profiles FOR SELECT 
USING ((has_role(auth.uid(), 'diretor'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 2. Fix commissions leaks
DROP POLICY IF EXISTS "Directors and admins can manage commissions" ON public.commissions;
CREATE POLICY "Directors and admins can manage commissions in their company" 
ON public.commissions FOR ALL 
USING (( (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'socio'::app_role)) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 3. Fix financial_records leaks
DROP POLICY IF EXISTS "Directors and Admins can manage all financial records" ON public.financial_records;
CREATE POLICY "Directors and Admins can manage all financial records in their company" 
ON public.financial_records FOR ALL 
USING (( (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'socio'::app_role)) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 4. Fix user_roles leaks
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles in their company" 
ON public.user_roles FOR ALL 
USING ((has_role(auth.uid(), 'admin'::app_role) AND user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid()))) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles in their company" 
ON public.user_roles FOR SELECT 
USING ((has_role(auth.uid(), 'admin'::app_role) AND user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid()))) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Directors can view all roles" ON public.user_roles;
CREATE POLICY "Directors can view all roles in their company" 
ON public.user_roles FOR SELECT 
USING ((has_role(auth.uid(), 'diretor'::app_role) AND user_id IN (SELECT id FROM profiles WHERE company_id = get_user_company_id(auth.uid()))) OR is_super_admin(auth.uid()));

-- 5. Fix sticky_notes leaks (assuming it exists and has company_id)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sticky_notes' AND schemaname = 'public') THEN
        ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "company_isolation" ON public.sticky_notes;
        CREATE POLICY "company_isolation" ON public.sticky_notes FOR ALL USING (company_id = get_user_company_id(auth.uid()));
    END IF;
END $$;

-- 6. Ensure Sócio Diretor has consistent access across all tables
-- This was already addressed in the policies above by adding 'socio' to the list.

-- 7. Audit logic for Gerente: Ensure they can only see their team if specified
-- Currently most tables use team_id for Gerentes.

-- 8. Final check on leads visibility function for Diretores without agency
CREATE OR REPLACE FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_viewer_company_id uuid;
  v_viewer_agency_id uuid;
  v_viewer_role text;
BEGIN
  -- Get context once
  SELECT company_id, agency_id INTO v_viewer_company_id, v_viewer_agency_id FROM public.profiles WHERE id = _viewer_id;
  v_viewer_role := get_user_primary_role(_viewer_id);

  -- Super admin: global access
  IF v_viewer_role = 'super_admin' THEN RETURN TRUE; END IF;

  -- Same company check
  IF _lead_company_id IS DISTINCT FROM v_viewer_company_id THEN RETURN FALSE; END IF;

  -- Roles: Admin/Socio: Full company access
  IF v_viewer_role IN ('admin', 'socio') THEN RETURN TRUE; END IF;

  -- Diretor: Agency access or company access if no agency assigned
  IF v_viewer_role = 'diretor' THEN
    RETURN (v_viewer_agency_id IS NULL OR _lead_agency_id = v_viewer_agency_id OR _lead_agency_id IS NULL);
  END IF;

  -- Gerente: Agency access (same as Diretor for now) or Team access if we had team_id in leads
  IF v_viewer_role = 'gerente' THEN
    RETURN (v_viewer_agency_id IS NULL OR _lead_agency_id = v_viewer_agency_id OR _lead_agency_id IS NULL);
  END IF;

  -- Corretor: Only own leads
  IF v_viewer_role = 'corretor' THEN
    RETURN (_lead_user_id = _viewer_id);
  END IF;

  RETURN FALSE;
END;
$function$;
