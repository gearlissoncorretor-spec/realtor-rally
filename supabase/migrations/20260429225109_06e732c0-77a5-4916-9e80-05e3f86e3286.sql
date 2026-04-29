-- Ensure get_my_role is SECURITY DEFINER to bypass recursion in RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'primary_role'),
    public.get_user_primary_role(auth.uid())
  );
$function$;

-- Ensure get_my_company_id is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COALESCE(
    (nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'company_id', ''))::uuid,
    (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );
$function$;

-- Ensure check_agency_access is robust
CREATE OR REPLACE FUNCTION public.check_agency_access(_company_id uuid, _agency_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_role text := get_my_role();
  v_my_company_id uuid := get_my_company_id();
  v_my_agency_id uuid;
BEGIN
  -- Super admin always has access
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
  
  -- Must be same company
  IF _company_id IS DISTINCT FROM v_my_company_id THEN RETURN FALSE; END IF;
  
  -- Admin, Socio, Diretor: Company-wide access
  IF v_role IN ('admin', 'socio', 'diretor') THEN RETURN TRUE; END IF;
  
  -- Gerente: Agency-specific access
  IF v_role = 'gerente' THEN
    v_my_agency_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'agency_id')::uuid;
    IF v_my_agency_id IS NULL THEN
       SELECT agency_id INTO v_my_agency_id FROM public.profiles WHERE id = auth.uid();
    END IF;
    RETURN (_agency_id = v_my_agency_id OR _agency_id IS NULL);
  END IF;
  
  RETURN FALSE; 
END;
$function$;

-- Fix user_roles policies to avoid infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Directors can view all roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Directors can manage non-admin roles in own company" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view roles in own company" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can manage broker roles in own company" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage company roles" ON public.user_roles;

-- Simplified and safe user_roles policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins manage all roles" 
ON public.user_roles FOR ALL 
USING ( (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'primary_role') = 'super_admin' );

CREATE POLICY "Admins manage company roles" 
ON public.user_roles FOR ALL 
USING (
  (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'primary_role') IN ('admin', 'socio', 'diretor')
  AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = public.user_roles.user_id 
    AND company_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'company_id')::uuid
  )
);

-- Ensure can_view_lead is also updated to be robust
CREATE OR REPLACE FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_viewer_company_id uuid;
  v_viewer_agency_id uuid;
  v_viewer_role text;
BEGIN
  v_viewer_role := get_my_role();
  v_viewer_company_id := get_my_company_id();

  IF v_viewer_role = 'super_admin' THEN RETURN TRUE; END IF;
  IF _lead_company_id IS DISTINCT FROM v_viewer_company_id THEN RETURN FALSE; END IF;
  IF v_viewer_role IN ('admin', 'socio', 'diretor') THEN RETURN TRUE; END IF;

  IF v_viewer_role = 'gerente' THEN
    v_viewer_agency_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'agency_id')::uuid;
    IF v_viewer_agency_id IS NULL THEN
       SELECT agency_id INTO v_viewer_agency_id FROM public.profiles WHERE id = _viewer_id;
    END IF;
    RETURN (_lead_agency_id = v_viewer_agency_id OR _lead_agency_id IS NULL);
  END IF;

  IF v_viewer_role = 'corretor' THEN
    RETURN (_lead_user_id = _viewer_id);
  END IF;

  RETURN FALSE;
END;
$function$;
