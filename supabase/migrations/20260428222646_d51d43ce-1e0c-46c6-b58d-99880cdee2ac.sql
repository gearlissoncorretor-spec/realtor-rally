-- 1. Fix leaky policies for teams
DROP POLICY IF EXISTS "All authenticated users can view teams" ON public.teams;
CREATE POLICY "Users can view teams in their company" 
ON public.teams FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- 2. Fix leaky policies for brokers
DROP POLICY IF EXISTS "brk_admin_view" ON public.brokers;
CREATE POLICY "Admins can view brokers in their company" 
ON public.brokers FOR SELECT 
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "brk_admin_update" ON public.brokers;
CREATE POLICY "Admins can update brokers in their company" 
ON public.brokers FOR UPDATE 
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 3. Fix leaky policies for sales
DROP POLICY IF EXISTS "sales_view" ON public.sales;
CREATE POLICY "Users can view sales based on role and company" 
ON public.sales FOR SELECT 
USING (
  (company_id = get_user_company_id(auth.uid())) AND (
    (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())) 
    OR (has_role(auth.uid(), 'gerente'::app_role))
    OR (has_role(auth.uid(), 'diretor'::app_role))
    OR (has_role(auth.uid(), 'socio'::app_role))
    OR (has_role(auth.uid(), 'admin'::app_role))
  )
  OR is_super_admin(auth.uid())
);

-- 4. Fix audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs in their company" 
ON public.audit_logs FOR SELECT 
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- 5. Fix role_permissions
DROP POLICY IF EXISTS "Users can view permissions" ON public.role_permissions;
CREATE POLICY "Users can view permissions in their company" 
ON public.role_permissions FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- 6. Add RLS for facebook_oauth_states
ALTER TABLE public.facebook_oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own oauth states" 
ON public.facebook_oauth_states FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 7. Consolidate goal tables and other small tables
DROP POLICY IF EXISTS "Authenticated users can view follow up statuses" ON public.follow_up_statuses;
CREATE POLICY "Users can view follow up statuses in their company" ON public.follow_up_statuses FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view negotiation statuses" ON public.negotiation_statuses;
CREATE POLICY "Users can view negotiation statuses in their company" ON public.negotiation_statuses FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view process stages" ON public.process_stages;
CREATE POLICY "Users can view process stages in their company" ON public.process_stages FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view goal types" ON public.goal_types;
CREATE POLICY "Users can view goal types in their company" ON public.goal_types FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view agencies" ON public.agencies;
CREATE POLICY "Users can view agencies in their company" ON public.agencies FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- 8. Improve get_user_role to handle multiple roles correctly and hierarchy
-- The current one is already okay but let's make sure it's used consistently.

-- 9. Fix organization_settings
DROP POLICY IF EXISTS "Public can view organization settings" ON public.organization_settings;
CREATE POLICY "Users can view organization settings in their company" ON public.organization_settings FOR SELECT USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));
