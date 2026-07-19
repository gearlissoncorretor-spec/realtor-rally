
-- 1. campaign_participants: add company scope to broker view policy
DROP POLICY IF EXISTS "brokers_view_participants" ON public.campaign_participants;
CREATE POLICY "brokers_view_participants" ON public.campaign_participants
FOR SELECT TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND campaign_id IN (SELECT c.id FROM public.campaigns c WHERE c.status = ANY (ARRAY['active','paused','finished']))
);

-- 2. commission_rules: enforce company scope in USING of admin manage policy
DROP POLICY IF EXISTS "Admins can manage commission rules" ON public.commission_rules;
CREATE POLICY "Admins can manage commission rules" ON public.commission_rules
FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role))
  AND company_id = get_user_company_id(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'diretor'::app_role))
  AND company_id = get_user_company_id(auth.uid())
);

-- 3. profiles: extend self-update lockdown to more sensitive fields (id, email, manager_id, status, full_name unchanged? keep name editable; lock manager_id + status)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND NOT (company_id     IS DISTINCT FROM (SELECT p.company_id     FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (team_id        IS DISTINCT FROM (SELECT p.team_id        FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (agency_id      IS DISTINCT FROM (SELECT p.agency_id      FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (approved       IS DISTINCT FROM (SELECT p.approved       FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (approved_by    IS DISTINCT FROM (SELECT p.approved_by    FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (approved_at    IS DISTINCT FROM (SELECT p.approved_at    FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (allowed_screens IS DISTINCT FROM (SELECT p.allowed_screens FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (manager_id     IS DISTINCT FROM (SELECT p.manager_id     FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (status         IS DISTINCT FROM (SELECT p.status         FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 4. Reassign policies from public role to authenticated on sensitive tables
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND 'public' = ANY(roles)
      AND tablename IN (
        'profiles','sales','gastos_corretor','commission_rules','organization_settings',
        'process_stages','negotiation_notes','facebook_lead_forms','facebook_connections',
        'facebook_pages','facebook_oauth_states','task_comments','task_attachments',
        'audit_logs','contact_submissions','teams'
      )
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
