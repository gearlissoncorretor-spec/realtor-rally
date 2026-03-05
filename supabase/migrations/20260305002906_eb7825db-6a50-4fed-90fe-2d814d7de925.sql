
-- Migrate existing data to default company
UPDATE public.profiles SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.brokers SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.teams SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.sales SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.negotiations SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.follow_ups SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.goals SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.goal_tasks SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.goal_progress SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.broker_activities SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.broker_tasks SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.broker_weekly_activities SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.broker_notes SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.targets SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.organization_settings SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.process_stages SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.follow_up_statuses SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.follow_up_contacts SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.column_targets SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.task_attachments SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.task_comments SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.task_history SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_brokers_company_id ON public.brokers(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON public.teams(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_company_id ON public.negotiations(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_company_id ON public.follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_goals_company_id ON public.goals(company_id);
CREATE INDEX IF NOT EXISTS idx_broker_activities_company_id ON public.broker_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_broker_tasks_company_id ON public.broker_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_targets_company_id ON public.targets(company_id);

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Auto-set company_id trigger function
CREATE OR REPLACE FUNCTION public.auto_set_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.company_id := get_user_company_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-set triggers on all tables (except profiles - handled by handle_new_user)
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.brokers FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.negotiations FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.goals FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.goal_tasks FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.goal_progress FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.broker_activities FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.broker_tasks FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.broker_weekly_activities FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.broker_notes FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.targets FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.process_stages FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.follow_up_statuses FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.follow_up_contacts FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.column_targets FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.task_attachments FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
CREATE TRIGGER auto_set_company_id BEFORE INSERT ON public.task_history FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();
