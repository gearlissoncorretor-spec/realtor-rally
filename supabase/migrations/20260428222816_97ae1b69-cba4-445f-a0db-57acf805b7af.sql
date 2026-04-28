-- Fix search_path for all security-sensitive functions
ALTER FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_company_id(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_role(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION public.is_super_admin(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_agency_id(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_team_id(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_current_user_admin_status() SET search_path = public;
ALTER FUNCTION public.get_user_primary_role(_user_id uuid) SET search_path = public;

-- Also fix any other found functions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT proname FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE nspname = 'public' AND prokind = 'f') 
    LOOP
        EXECUTE 'ALTER FUNCTION public.' || r.proname || ' SET search_path = public';
    END LOOP;
END $$;
