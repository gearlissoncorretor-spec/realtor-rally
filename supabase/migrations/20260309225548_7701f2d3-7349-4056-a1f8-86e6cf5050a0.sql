
-- Calendar events table
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  event_type text NOT NULL DEFAULT 'reuniao',
  responsible_id uuid REFERENCES auth.users(id),
  client_name text,
  property_reference text,
  is_private boolean NOT NULL DEFAULT false,
  is_all_day boolean NOT NULL DEFAULT false,
  color text DEFAULT '#3b82f6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Sharing table
CREATE TABLE public.calendar_event_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT share_target_check CHECK (
    shared_with_user_id IS NOT NULL OR shared_with_team_id IS NOT NULL
  )
);

ALTER TABLE public.calendar_event_shares ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER set_company_id_calendar_events
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_company_id_calendar_event_shares
  BEFORE INSERT ON public.calendar_event_shares
  FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

-- RLS for calendar_events: owner can do everything
CREATE POLICY "Users manage own events"
  ON public.calendar_events FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can see events shared with them directly
CREATE POLICY "Users see shared events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT event_id FROM public.calendar_event_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );

-- Users can see events shared with their team
CREATE POLICY "Users see team shared events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (
    is_private = false AND id IN (
      SELECT event_id FROM public.calendar_event_shares
      WHERE shared_with_team_id = get_user_team_id(auth.uid())
    )
  );

-- Managers can see all non-private events from their team members
CREATE POLICY "Managers see team events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (
    is_private = false
    AND get_user_role(auth.uid()) = 'gerente'
    AND user_id IN (
      SELECT id FROM public.profiles WHERE team_id = get_user_team_id(auth.uid())
    )
  );

-- Directors/admins see all non-private events
CREATE POLICY "Directors see all events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (
    is_private = false
    AND (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true)
  );

-- Company isolation for events
CREATE POLICY "company_isolation_events"
  ON public.calendar_events FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- RLS for shares: event owner manages shares
CREATE POLICY "Event owners manage shares"
  ON public.calendar_event_shares FOR ALL TO authenticated
  USING (
    event_id IN (SELECT id FROM public.calendar_events WHERE user_id = auth.uid())
  )
  WITH CHECK (
    event_id IN (SELECT id FROM public.calendar_events WHERE user_id = auth.uid())
  );

-- Users can see shares involving them
CREATE POLICY "Users see own shares"
  ON public.calendar_event_shares FOR SELECT TO authenticated
  USING (
    shared_with_user_id = auth.uid()
    OR shared_with_team_id = get_user_team_id(auth.uid())
  );

-- Company isolation for shares
CREATE POLICY "company_isolation_shares"
  ON public.calendar_event_shares FOR ALL TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));
