-- 1. Function to sync user metadata to auth.users (caches company_id and role in JWT)
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get primary role
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = NEW.id ORDER BY 
    CASE role::text
      WHEN 'super_admin' THEN 0
      WHEN 'socio' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'diretor' THEN 3
      WHEN 'gerente' THEN 4
      WHEN 'corretor' THEN 5
      ELSE 6
    END
  LIMIT 1;

  -- Update auth.users app_metadata
  UPDATE auth.users 
  SET raw_app_metadata = raw_app_metadata || 
    jsonb_build_object(
      'company_id', NEW.company_id,
      'agency_id', NEW.agency_id,
      'primary_role', v_role
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on profiles to keep metadata synced
DROP TRIGGER IF EXISTS on_profile_update_sync_metadata ON public.profiles;
CREATE TRIGGER on_profile_update_sync_metadata
AFTER UPDATE OF company_id, agency_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata();

-- 3. Optimization for RLS check functions using JWT cache
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid 
STABLE
AS $$
  -- Try to get from JWT first (zero cost)
  -- Fallback to database lookup if metadata not yet populated
  SELECT COALESCE(
    (nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'company_id', ''))::uuid,
    (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text 
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'primary_role',
    public.get_user_primary_role(auth.uid())
  );
$$ LANGUAGE sql;

-- 4. Update core RLS helper function for performance
CREATE OR REPLACE FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public
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

  -- Roles: Admin/Socio: Full company access
  IF v_viewer_role IN ('admin', 'socio') THEN RETURN TRUE; END IF;

  -- Diretor/Gerente: Agency access
  IF v_viewer_role IN ('diretor', 'gerente') THEN
    v_viewer_agency_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'agency_id')::uuid;
    IF v_viewer_agency_id IS NULL THEN
       -- If no metadata, fallback to lookup once
       SELECT agency_id INTO v_viewer_agency_id FROM public.profiles WHERE id = _viewer_id;
    END IF;
    
    RETURN (v_viewer_agency_id IS NULL OR _lead_agency_id = v_viewer_agency_id OR _lead_agency_id IS NULL);
  END IF;

  -- Corretor: Only own leads
  IF v_viewer_role = 'corretor' THEN
    RETURN (_lead_user_id = _viewer_id);
  END IF;

  RETURN FALSE;
END;
$function$;

-- 5. Additional composite indexes for fast filtering in large companies
CREATE INDEX IF NOT EXISTS idx_leads_company_status ON public.leads (company_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON public.sales (company_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_broker_activities_broker_date ON public.broker_activities (broker_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_commissions_broker_status ON public.commissions (broker_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_records_company_due ON public.financial_records (company_id, due_date);

-- 6. Pre-populate metadata for existing users
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.profiles LOOP
    BEGIN
      PERFORM public.sync_user_metadata() FROM (SELECT r.*) as p;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not sync metadata for user %', r.id;
    END;
  END LOOP;
END $$;
