
-- CORREÇÃO CRÍTICA 1: Impedir escalação de privilégios por diretores
DROP POLICY IF EXISTS "Directors can manage all roles" ON public.user_roles;

CREATE POLICY "Directors can manage non-admin roles in own company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  AND user_id IN (
    SELECT id FROM public.profiles
    WHERE company_id = get_user_company_id(auth.uid())
  )
  AND role NOT IN ('super_admin')
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  AND user_id IN (
    SELECT id FROM public.profiles
    WHERE company_id = get_user_company_id(auth.uid())
  )
  AND role NOT IN ('super_admin')
);

-- CORREÇÃO CRÍTICA 2: Bloquear inserção anônima de corretores
DROP POLICY IF EXISTS "Service role can insert brokers" ON public.brokers;

CREATE POLICY "Service role can insert brokers"
ON public.brokers
FOR INSERT
TO service_role
WITH CHECK (true);

-- CORREÇÃO CRÍTICA 3: Google Calendar tokens - RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation" ON public.google_calendar_tokens;

CREATE POLICY "company_isolation"
ON public.google_calendar_tokens
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
);

-- CORREÇÃO 4: Comissões - company_isolation RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation" ON public.commissions;

CREATE POLICY "company_isolation"
ON public.commissions
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
);

-- CORREÇÃO 5: Push subscriptions - RESTRICTIVE
DROP POLICY IF EXISTS "push_subs_company_isolation" ON public.push_subscriptions;

CREATE POLICY "push_subs_company_isolation"
ON public.push_subscriptions
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
);

-- CORREÇÃO 6: Process stages - apenas authenticated
DROP POLICY IF EXISTS "Everyone can view process stages" ON public.process_stages;

CREATE POLICY "Authenticated users can view process stages"
ON public.process_stages
FOR SELECT
TO authenticated
USING (true);

-- CORREÇÃO 7: Follow-up statuses - apenas authenticated
DROP POLICY IF EXISTS "Anyone can view follow up statuses" ON public.follow_up_statuses;

CREATE POLICY "Authenticated users can view follow up statuses"
ON public.follow_up_statuses
FOR SELECT
TO authenticated
USING (true);

-- CORREÇÃO 8: Goal types - company_isolation RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation_goal_types" ON public.goal_types;

CREATE POLICY "company_isolation_goal_types"
ON public.goal_types
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
)
WITH CHECK (
  (company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid())
);
