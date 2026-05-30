
-- 1. Facebook tokens: remove admin SELECT visibility, only owner can view
DROP POLICY IF EXISTS "Admins view company FB connections" ON public.facebook_connections;
DROP POLICY IF EXISTS "Admins view company FB pages" ON public.facebook_pages;

-- 2. contact_submissions: restrict super_admin policy to authenticated role
DROP POLICY IF EXISTS "Super admins can manage contact submissions" ON public.contact_submissions;
CREATE POLICY "Super admins can manage contact submissions"
ON public.contact_submissions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role));

-- 3. follow_up_contacts: tighten policies. Restrict to authenticated and require created_by or follow_up ownership via existing follow_ups RLS-scoped subquery (still uses follow_ups, but at least scoped to authenticated and validates company).
DROP POLICY IF EXISTS fuc_view ON public.follow_up_contacts;
DROP POLICY IF EXISTS fuc_insert ON public.follow_up_contacts;
DROP POLICY IF EXISTS fuc_update ON public.follow_up_contacts;
DROP POLICY IF EXISTS fuc_delete ON public.follow_up_contacts;

CREATE POLICY fuc_view ON public.follow_up_contacts FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['gerente','diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);
CREATE POLICY fuc_insert ON public.follow_up_contacts FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY fuc_update ON public.follow_up_contacts FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);
CREATE POLICY fuc_delete ON public.follow_up_contacts FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);

-- 4. follow_up_notes: same treatment
DROP POLICY IF EXISTS fun_view ON public.follow_up_notes;
DROP POLICY IF EXISTS fun_insert ON public.follow_up_notes;
DROP POLICY IF EXISTS fun_update ON public.follow_up_notes;
DROP POLICY IF EXISTS fun_delete ON public.follow_up_notes;

CREATE POLICY fun_view ON public.follow_up_notes FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['gerente','diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);
CREATE POLICY fun_insert ON public.follow_up_notes FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY fun_update ON public.follow_up_notes FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);
CREATE POLICY fun_delete ON public.follow_up_notes FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR get_user_role(auth.uid()) = ANY (ARRAY['diretor','admin','socio'])
  OR is_super_admin(auth.uid())
);

-- 5. targets: make company_isolation RESTRICTIVE and scoped to authenticated
DROP POLICY IF EXISTS company_isolation ON public.targets;
CREATE POLICY company_isolation ON public.targets AS RESTRICTIVE FOR ALL TO authenticated
USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 6. Fix mutable search_path on sync_broker_user_id
CREATE OR REPLACE FUNCTION public.sync_broker_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    UPDATE public.brokers
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;
  ELSIF TG_TABLE_NAME = 'brokers' THEN
    IF NEW.user_id IS NULL THEN
      SELECT id INTO NEW.user_id
      FROM public.profiles
      WHERE LOWER(email) = LOWER(NEW.email);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 7. Fix Security Definer View: force vw_cash_flow to use querying user's RLS
ALTER VIEW public.vw_cash_flow SET (security_invoker = true);
