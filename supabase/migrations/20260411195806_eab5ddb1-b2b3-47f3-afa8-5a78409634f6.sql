
-- ================================================================
-- AGENCY ISOLATION - PART 2 (enum already added)
-- ================================================================

-- 1. Create agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_agencies" ON public.agencies
  AS RESTRICTIVE FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can view agencies" ON public.agencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Socios and admins manage agencies" ON public.agencies
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['socio', 'admin']) OR is_super_admin(auth.uid()));

CREATE POLICY "Socios and admins update agencies" ON public.agencies
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = ANY(ARRAY['socio', 'admin']) OR is_super_admin(auth.uid()));

CREATE POLICY "Socios and admins delete agencies" ON public.agencies
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = ANY(ARRAY['socio', 'admin']) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER auto_set_company_id_agencies
  BEFORE INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

-- 2. Add agency_id columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.broker_activities ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.broker_weekly_activities ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.broker_tasks ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.sticky_notes ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.broker_notes ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.commission_installments ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.goal_tasks ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.goal_progress ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.follow_up_contacts ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.follow_up_notes ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.negotiation_notes ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.campaign_participants ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.campaign_reports ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.column_targets ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.calendar_event_shares ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- 3. Indexes
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles', 'brokers', 'teams', 'sales', 'negotiations', 'follow_ups',
    'goals', 'commissions', 'broker_activities', 'broker_weekly_activities',
    'broker_tasks', 'campaigns', 'calendar_events', 'sticky_notes',
    'broker_notes', 'commission_installments', 'goal_tasks', 'goal_progress',
    'follow_up_contacts', 'follow_up_notes', 'negotiation_notes',
    'campaign_participants', 'campaign_reports', 'column_targets',
    'calendar_event_shares'
  ])
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_agency_id ON public.%I(agency_id)', t, t);
  END LOOP;
END;
$$;

-- 4. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_socio(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'socio'
  )
$$;

CREATE OR REPLACE FUNCTION public.auto_set_agency_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.agency_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.agency_id := get_user_agency_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Update get_user_primary_role to include socio
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text
      WHEN 'super_admin' THEN 0
      WHEN 'socio' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'diretor' THEN 3
      WHEN 'gerente' THEN 4
      WHEN 'corretor' THEN 5
      ELSE 6
    END
  LIMIT 1
$$;

-- Update get_team_hierarchy for socio + agency-scoped director
CREATE OR REPLACE FUNCTION public.get_team_hierarchy(user_id uuid)
RETURNS TABLE(team_id uuid, team_name text, is_manager boolean, team_members uuid[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_info AS (
    SELECT 
      p.id,
      p.team_id,
      p.agency_id,
      p.company_id,
      t.name as team_name,
      get_user_primary_role(p.id) as user_role
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    WHERE p.id = user_id
  )
  SELECT 
    ui.team_id,
    ui.team_name,
    (ui.user_role = 'gerente'),
    CASE 
      WHEN ui.user_role IN ('socio', 'admin') THEN 
        ARRAY(SELECT id FROM public.profiles WHERE company_id = ui.company_id)
      WHEN ui.user_role = 'diretor' THEN 
        ARRAY(
          SELECT id FROM public.profiles 
          WHERE company_id = ui.company_id 
            AND (agency_id = ui.agency_id OR agency_id IS NULL)
        )
      WHEN ui.user_role = 'gerente' THEN 
        ARRAY(SELECT id FROM public.profiles WHERE team_id = ui.team_id)
      ELSE 
        ARRAY[user_id]
    END as team_members
  FROM user_info ui;
$$;

-- 5. Auto-set agency_id triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'brokers', 'teams', 'sales', 'negotiations', 'follow_ups',
    'goals', 'commissions', 'broker_activities', 'broker_weekly_activities',
    'broker_tasks', 'campaigns', 'calendar_events', 'sticky_notes',
    'broker_notes', 'commission_installments', 'goal_tasks', 'goal_progress',
    'follow_up_contacts', 'follow_up_notes', 'negotiation_notes',
    'campaign_participants', 'campaign_reports', 'column_targets',
    'calendar_event_shares'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER auto_set_agency_id_%s
         BEFORE INSERT ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.auto_set_agency_id()',
        t, t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

-- 6. Agency isolation RESTRICTIVE policies
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'brokers', 'teams', 'sales', 'negotiations', 'follow_ups',
    'goals', 'commissions', 'broker_activities', 'broker_weekly_activities',
    'broker_tasks', 'campaigns', 'calendar_events', 'sticky_notes',
    'broker_notes', 'commission_installments', 'goal_tasks', 'goal_progress',
    'follow_up_contacts', 'follow_up_notes', 'negotiation_notes',
    'campaign_participants', 'campaign_reports', 'column_targets',
    'calendar_event_shares'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "agency_isolation" ON public.%I
         AS RESTRICTIVE FOR ALL TO authenticated
         USING (
           agency_id IS NULL
           OR agency_id = get_user_agency_id(auth.uid())
           OR get_user_role(auth.uid()) = ANY(ARRAY[''socio'', ''admin''])
           OR is_super_admin(auth.uid())
         )
         WITH CHECK (
           agency_id IS NULL
           OR agency_id = get_user_agency_id(auth.uid())
           OR get_user_role(auth.uid()) = ANY(ARRAY[''socio'', ''admin''])
           OR is_super_admin(auth.uid())
         )',
        t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

-- 7. Socio PERMISSIVE policies for data tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'brokers', 'teams', 'sales', 'negotiations', 'follow_ups',
    'goals', 'commissions', 'broker_activities', 'broker_weekly_activities',
    'broker_tasks', 'campaigns', 'calendar_events', 'sticky_notes',
    'broker_notes', 'commission_installments', 'goal_tasks', 'goal_progress',
    'follow_up_contacts', 'follow_up_notes', 'negotiation_notes',
    'campaign_participants', 'campaign_reports', 'column_targets',
    'calendar_event_shares'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "Socios can manage all data" ON public.%I
         FOR ALL TO authenticated
         USING (get_user_role(auth.uid()) = ''socio'')
         WITH CHECK (get_user_role(auth.uid()) = ''socio'')',
        t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

-- 8. Socio permissive policies for config tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'follow_up_statuses', 'negotiation_statuses', 'goal_types',
    'process_stages', 'organization_settings', 'role_permissions'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "Socios can manage config" ON public.%I
         FOR ALL TO authenticated
         USING (get_user_role(auth.uid()) = ''socio'')
         WITH CHECK (get_user_role(auth.uid()) = ''socio'')',
        t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;
