
-- 1. campaign_reports: scope broker view by company
DROP POLICY IF EXISTS "brokers_view_reports" ON public.campaign_reports;
CREATE POLICY "brokers_view_reports" ON public.campaign_reports
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- 2. goals: replace true with explicit company scope
DROP POLICY IF EXISTS "goals_view" ON public.goals;
CREATE POLICY "goals_view" ON public.goals
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- 3. goal_tasks, goal_progress, targets, process_stages, negotiation_statuses, follow_up_statuses
DROP POLICY IF EXISTS "gt_view" ON public.goal_tasks;
CREATE POLICY "gt_view" ON public.goal_tasks
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "gp_view" ON public.goal_progress;
CREATE POLICY "gp_view" ON public.goal_progress
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "tgt_view" ON public.targets;
CREATE POLICY "tgt_view" ON public.targets
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "ps_view" ON public.process_stages;
CREATE POLICY "ps_view" ON public.process_stages
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "ns_view" ON public.negotiation_statuses;
CREATE POLICY "ns_view" ON public.negotiation_statuses
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "fus_view" ON public.follow_up_statuses;
CREATE POLICY "fus_view" ON public.follow_up_statuses
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- 4. task_attachments, task_comments, task_history: embed company_id check
DROP POLICY IF EXISTS "Users can view attachments on accessible tasks" ON public.task_attachments;
CREATE POLICY "Users can view attachments on accessible tasks" ON public.task_attachments
  FOR SELECT TO authenticated
  USING (
    (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    AND task_id IN (
      SELECT id FROM public.broker_tasks
      WHERE company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON public.task_attachments;
CREATE POLICY "Authenticated users can upload attachments" ON public.task_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND uploaded_by = auth.uid()
    AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    AND task_id IN (
      SELECT bt.id FROM public.broker_tasks bt
      LEFT JOIN public.brokers b ON b.id = bt.broker_id
      WHERE
        (bt.company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
        AND (
          b.user_id = auth.uid()
          OR bt.created_by = auth.uid()
          OR public.get_user_role(auth.uid()) = ANY (ARRAY['gerente','diretor','admin','socio'])
          OR public.is_super_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can view comments on accessible tasks" ON public.task_comments
  FOR SELECT TO authenticated
  USING (
    (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    AND task_id IN (
      SELECT id FROM public.broker_tasks
      WHERE company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view history of accessible tasks" ON public.task_history;
CREATE POLICY "Users can view history of accessible tasks" ON public.task_history
  FOR SELECT TO authenticated
  USING (
    (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
    AND task_id IN (
      SELECT id FROM public.broker_tasks
      WHERE company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid())
    )
  );

-- 5. user_roles: use DB-backed helpers instead of stale JWT claims
DROP POLICY IF EXISTS "Admins manage company roles" ON public.user_roles;
CREATE POLICY "Admins manage company roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'socio') OR public.has_role(auth.uid(), 'diretor'))
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.company_id = public.get_user_company_id(auth.uid())
    )
  )
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'socio') OR public.has_role(auth.uid(), 'diretor'))
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.company_id = public.get_user_company_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins manage all roles" ON public.user_roles;
CREATE POLICY "Super admins manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
