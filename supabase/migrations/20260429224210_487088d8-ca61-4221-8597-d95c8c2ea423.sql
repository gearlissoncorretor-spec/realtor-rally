-- Add agency_id to targets
ALTER TABLE public.targets ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id);

-- Update can_view_lead to include Diretor at company level
CREATE OR REPLACE FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_viewer_company_id uuid;
  v_viewer_agency_id uuid;
  v_viewer_role text;
BEGIN
  -- Use optimized getters
  v_viewer_company_id := get_my_company_id();
  v_viewer_role := get_my_role();

  -- Super admin: global access
  IF v_viewer_role = 'super_admin' THEN RETURN TRUE; END IF;

  -- Same company check
  IF _lead_company_id IS DISTINCT FROM v_viewer_company_id THEN RETURN FALSE; END IF;

  -- Roles: Admin/Socio/Diretor: Full company access
  IF v_viewer_role IN ('admin', 'socio', 'diretor') THEN RETURN TRUE; END IF;

  -- Gerente: Agency access
  IF v_viewer_role = 'gerente' THEN
    -- Try to get from JWT first
    v_viewer_agency_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'agency_id')::uuid;
    IF v_viewer_agency_id IS NULL THEN
       -- If no metadata, fallback to lookup
       SELECT agency_id INTO v_viewer_agency_id FROM public.profiles WHERE id = _viewer_id;
    END IF;
    
    RETURN (_lead_agency_id = v_viewer_agency_id OR _lead_agency_id IS NULL);
  END IF;

  -- Corretor: Only own leads
  IF v_viewer_role = 'corretor' THEN
    RETURN (_lead_user_id = _viewer_id);
  END IF;

  RETURN FALSE;
END;
$function$;

-- Generic access function for agency/company level
CREATE OR REPLACE FUNCTION public.check_agency_access(_company_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text := get_my_role();
  v_company_id uuid := get_my_company_id();
  v_agency_id uuid;
BEGIN
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
  IF _company_id IS DISTINCT FROM v_company_id THEN RETURN FALSE; END IF;
  IF v_role IN ('admin', 'socio', 'diretor') THEN RETURN TRUE; END IF;
  
  IF v_role = 'gerente' THEN
    v_agency_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'agency_id')::uuid;
    IF v_agency_id IS NULL THEN
       SELECT agency_id INTO v_agency_id FROM public.profiles WHERE id = auth.uid();
    END IF;
    RETURN (_agency_id = v_agency_id OR _agency_id IS NULL);
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update RLS for sales
DROP POLICY IF EXISTS "agency_isolation" ON public.sales;
CREATE POLICY "agency_isolation" ON public.sales
FOR ALL USING (check_agency_access(company_id, agency_id));

-- Update RLS for commissions
DROP POLICY IF EXISTS "agency_isolation" ON public.commissions;
CREATE POLICY "agency_isolation" ON public.commissions
FOR ALL USING (check_agency_access(company_id, agency_id));

-- Update RLS for financial_records
DROP POLICY IF EXISTS "agency_isolation" ON public.financial_records;
CREATE POLICY "agency_isolation" ON public.financial_records
FOR ALL USING (check_agency_access(company_id, agency_id));

-- Add/Update RLS for targets
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_isolation" ON public.targets;
CREATE POLICY "company_isolation" ON public.targets
FOR ALL USING (check_agency_access(company_id, agency_id));

-- Ensure profiles are also isolated or accessible correctly
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view profiles in their company"
ON public.profiles FOR SELECT
USING (company_id = get_my_company_id());
