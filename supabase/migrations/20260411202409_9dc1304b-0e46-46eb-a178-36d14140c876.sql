
-- FIX 1: Profile self-update escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid())
  AND team_id IS NOT DISTINCT FROM (SELECT p.team_id FROM public.profiles p WHERE p.id = auth.uid())
  AND agency_id IS NOT DISTINCT FROM (SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid())
  AND approved IS NOT DISTINCT FROM (SELECT p.approved FROM public.profiles p WHERE p.id = auth.uid())
  AND approved_by IS NOT DISTINCT FROM (SELECT p.approved_by FROM public.profiles p WHERE p.id = auth.uid())
  AND approved_at IS NOT DISTINCT FROM (SELECT p.approved_at FROM public.profiles p WHERE p.id = auth.uid())
  AND allowed_screens IS NOT DISTINCT FROM (SELECT p.allowed_screens FROM public.profiles p WHERE p.id = auth.uid())
);

-- FIX 2: {public} → {authenticated}

-- broker_activities
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='broker_activities' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.broker_activities', pol.policyname); END LOOP;
END $$;
CREATE POLICY "ba_broker_view" ON public.broker_activities FOR SELECT TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
CREATE POLICY "ba_broker_insert" ON public.broker_activities FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
CREATE POLICY "ba_broker_update" ON public.broker_activities FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
CREATE POLICY "ba_manager_all" ON public.broker_activities FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- broker_notes
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='broker_notes' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.broker_notes', pol.policyname); END LOOP;
END $$;
CREATE POLICY "bn_view" ON public.broker_notes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bn_insert" ON public.broker_notes FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bn_update" ON public.broker_notes FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bn_delete" ON public.broker_notes FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- broker_tasks
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='broker_tasks' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.broker_tasks', pol.policyname); END LOOP;
END $$;
CREATE POLICY "bt_view" ON public.broker_tasks FOR SELECT TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bt_insert" ON public.broker_tasks FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bt_update" ON public.broker_tasks FOR UPDATE TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bt_delete" ON public.broker_tasks FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- broker_weekly_activities
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='broker_weekly_activities' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.broker_weekly_activities', pol.policyname); END LOOP;
END $$;
CREATE POLICY "bwa_view" ON public.broker_weekly_activities FOR SELECT TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "bwa_manage" ON public.broker_weekly_activities FOR ALL TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- brokers
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='brokers' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.brokers', pol.policyname); END LOOP;
END $$;
CREATE POLICY "brk_admin_view" ON public.brokers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "brk_admin_update" ON public.brokers FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "brk_mgr_view" ON public.brokers FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()));
CREATE POLICY "brk_mgr_update" ON public.brokers FOR UPDATE TO authenticated
USING ((get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid())) OR user_id = auth.uid());
CREATE POLICY "brk_mgr_insert" ON public.brokers FOR INSERT TO authenticated
WITH CHECK ((get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid())) OR get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true);
CREATE POLICY "brk_mgr_delete" ON public.brokers FOR DELETE TO authenticated
USING ((get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid())) OR get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true);
CREATE POLICY "brk_admin_insert" ON public.brokers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "brk_admin_delete" ON public.brokers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- column_targets
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='column_targets' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.column_targets', pol.policyname); END LOOP;
END $$;
CREATE POLICY "ct_view" ON public.column_targets FOR SELECT TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "ct_manage" ON public.column_targets FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- follow_up_statuses
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='follow_up_statuses' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.follow_up_statuses', pol.policyname); END LOOP;
END $$;
CREATE POLICY "fus_admin" ON public.follow_up_statuses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor') OR is_socio(auth.uid()) OR is_super_admin(auth.uid()));
CREATE POLICY "fus_view" ON public.follow_up_statuses FOR SELECT TO authenticated USING (true);

-- follow_ups
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='follow_ups' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.follow_ups', pol.policyname); END LOOP;
END $$;
CREATE POLICY "fu_view" ON public.follow_ups FOR SELECT TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "fu_insert" ON public.follow_ups FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "fu_update" ON public.follow_ups FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "fu_delete" ON public.follow_ups FOR DELETE TO authenticated
USING (created_by = auth.uid() OR get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- goal_progress
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='goal_progress' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.goal_progress', pol.policyname); END LOOP;
END $$;
CREATE POLICY "gp_view" ON public.goal_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "gp_insert" ON public.goal_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gp_update" ON public.goal_progress FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- negotiations
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='negotiations' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.negotiations', pol.policyname); END LOOP;
END $$;
CREATE POLICY "neg_view" ON public.negotiations FOR SELECT TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "neg_insert" ON public.negotiations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "neg_update" ON public.negotiations FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "neg_delete" ON public.negotiations FOR DELETE TO authenticated
USING (created_by = auth.uid() OR get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- profiles (public role)
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname); END LOOP;
END $$;
CREATE POLICY "prof_diretor_view" ON public.profiles FOR SELECT TO authenticated USING (get_user_role(auth.uid()) = 'diretor');
CREATE POLICY "prof_diretor_update" ON public.profiles FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'diretor');
CREATE POLICY "prof_gerente_view" ON public.profiles FOR SELECT TO authenticated
USING (get_user_role(auth.uid()) = 'gerente' AND team_id = get_user_team_id(auth.uid()));

-- FIX 3: follow_up_notes and negotiation_notes
DROP POLICY IF EXISTS "Users can view follow_up notes" ON public.follow_up_notes;
DROP POLICY IF EXISTS "Users can insert follow_up notes" ON public.follow_up_notes;
CREATE POLICY "fun_view" ON public.follow_up_notes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR follow_up_id IN (SELECT id FROM public.follow_ups WHERE created_by = auth.uid() OR broker_id IN (SELECT bid.id FROM public.brokers bid WHERE bid.user_id = auth.uid())) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "fun_insert" ON public.follow_up_notes FOR INSERT TO authenticated
WITH CHECK (follow_up_id IN (SELECT id FROM public.follow_ups WHERE created_by = auth.uid() OR broker_id IN (SELECT bid.id FROM public.brokers bid WHERE bid.user_id = auth.uid())) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view notes for accessible negotiations" ON public.negotiation_notes;
DROP POLICY IF EXISTS "Users can insert notes for accessible negotiations" ON public.negotiation_notes;
CREATE POLICY "nn_view" ON public.negotiation_notes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR negotiation_id IN (SELECT id FROM public.negotiations WHERE created_by = auth.uid() OR broker_id IN (SELECT bid.id FROM public.brokers bid WHERE bid.user_id = auth.uid())) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "nn_insert" ON public.negotiation_notes FOR INSERT TO authenticated
WITH CHECK (negotiation_id IN (SELECT id FROM public.negotiations WHERE created_by = auth.uid() OR broker_id IN (SELECT bid.id FROM public.brokers bid WHERE bid.user_id = auth.uid())) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- FIX 4: Task attachments storage
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;
CREATE POLICY "Users can view task attachments" ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments' AND ((auth.uid())::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'diretor', 'gerente', 'socio'))));

-- FIX 5: Remaining tables

-- sales
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='sales' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales', pol.policyname); END LOOP;
END $$;
CREATE POLICY "sales_view" ON public.sales FOR SELECT TO authenticated
USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "sales_insert" ON public.sales FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "sales_update" ON public.sales FOR UPDATE TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "sales_delete" ON public.sales FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- process_stages
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='process_stages' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.process_stages', pol.policyname); END LOOP;
END $$;
CREATE POLICY "ps_view" ON public.process_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ps_manage" ON public.process_stages FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- sticky_notes (uses user_id, not created_by)
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='sticky_notes' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.sticky_notes', pol.policyname); END LOOP;
END $$;
CREATE POLICY "sn_view" ON public.sticky_notes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "sn_insert" ON public.sticky_notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sn_update" ON public.sticky_notes FOR UPDATE TO authenticated USING (user_id = auth.uid() OR get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "sn_delete" ON public.sticky_notes FOR DELETE TO authenticated USING (user_id = auth.uid() OR get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- targets
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='targets' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.targets', pol.policyname); END LOOP;
END $$;
CREATE POLICY "tgt_view" ON public.targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tgt_manage" ON public.targets FOR ALL TO authenticated
USING (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));

-- goals
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='goals' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.goals', pol.policyname); END LOOP;
END $$;
CREATE POLICY "goals_view" ON public.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "goals_insert" ON public.goals FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "goals_update" ON public.goals FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "goals_delete" ON public.goals FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- goal_tasks
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='goal_tasks' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.goal_tasks', pol.policyname); END LOOP;
END $$;
CREATE POLICY "gt_view" ON public.goal_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "gt_insert" ON public.goal_tasks FOR INSERT TO authenticated
WITH CHECK (get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "gt_update" ON public.goal_tasks FOR UPDATE TO authenticated
USING (assigned_to = auth.uid() OR created_by = auth.uid() OR get_user_role(auth.uid()) IN ('gerente','diretor','admin','socio') OR is_super_admin(auth.uid()));
CREATE POLICY "gt_delete" ON public.goal_tasks FOR DELETE TO authenticated
USING (get_user_role(auth.uid()) IN ('diretor','admin','socio') OR is_super_admin(auth.uid()));

-- negotiation_statuses
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='negotiation_statuses' AND roles::text LIKE '%{public}%'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.negotiation_statuses', pol.policyname); END LOOP;
END $$;
CREATE POLICY "ns_view" ON public.negotiation_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "ns_manage" ON public.negotiation_statuses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'diretor') OR is_socio(auth.uid()) OR is_super_admin(auth.uid()));
