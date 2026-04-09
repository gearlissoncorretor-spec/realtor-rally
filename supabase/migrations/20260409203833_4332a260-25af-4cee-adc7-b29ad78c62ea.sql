
-- 1. Campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  started_at timestamptz,
  finished_at timestamptz,
  meta_calls integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER auto_set_company_id_campaigns
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

-- Company isolation (restrictive)
CREATE POLICY "company_isolation_campaigns" ON public.campaigns
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Directors/admins full access
CREATE POLICY "directors_manage_campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  WITH CHECK (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status());

-- Managers can manage campaigns
CREATE POLICY "managers_manage_campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'gerente')
  WITH CHECK (get_user_role(auth.uid()) = 'gerente');

-- Brokers can view active campaigns
CREATE POLICY "brokers_view_active_campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (status IN ('active', 'paused', 'finished'));

-- 2. Campaign participants table
CREATE TABLE public.campaign_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  calls integer NOT NULL DEFAULT 0,
  negotiations integer NOT NULL DEFAULT 0,
  captures integer NOT NULL DEFAULT 0,
  appointments integer NOT NULL DEFAULT 0,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, broker_id)
);

ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_campaign_participants_updated_at
  BEFORE UPDATE ON public.campaign_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER auto_set_company_id_campaign_participants
  BEFORE INSERT ON public.campaign_participants
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

-- Company isolation (restrictive)
CREATE POLICY "company_isolation_campaign_participants" ON public.campaign_participants
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Directors/admins full access
CREATE POLICY "directors_manage_participants" ON public.campaign_participants
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  WITH CHECK (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status());

-- Managers manage team participants
CREATE POLICY "managers_manage_team_participants" ON public.campaign_participants
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'gerente' AND broker_id IN (SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())))
  WITH CHECK (get_user_role(auth.uid()) = 'gerente' AND broker_id IN (SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())));

-- Brokers can view all participants (for ranking)
CREATE POLICY "brokers_view_participants" ON public.campaign_participants
  FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT c.id FROM campaigns c WHERE c.status IN ('active', 'paused', 'finished')));

-- Brokers can update their own counters
CREATE POLICY "brokers_update_own_participants" ON public.campaign_participants
  FOR UPDATE TO authenticated
  USING (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  WITH CHECK (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()));

-- 3. Campaign reports table
CREATE TABLE public.campaign_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
  total_calls integer NOT NULL DEFAULT 0,
  total_negotiations integer NOT NULL DEFAULT 0,
  total_captures integer NOT NULL DEFAULT 0,
  total_appointments integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_campaign_reports_updated_at
  BEFORE UPDATE ON public.campaign_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER auto_set_company_id_campaign_reports
  BEFORE INSERT ON public.campaign_reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

-- Company isolation (restrictive)
CREATE POLICY "company_isolation_campaign_reports" ON public.campaign_reports
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Directors/admins full access
CREATE POLICY "directors_manage_reports" ON public.campaign_reports
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  WITH CHECK (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status());

-- Managers can view reports
CREATE POLICY "managers_view_reports" ON public.campaign_reports
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'gerente');

-- Brokers can view reports
CREATE POLICY "brokers_view_reports" ON public.campaign_reports
  FOR SELECT TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_participants;
