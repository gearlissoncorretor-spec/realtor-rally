-- Create helper functions for calendar events to avoid recursion
CREATE OR REPLACE FUNCTION public.check_is_event_owner(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calendar_events 
    WHERE id = _event_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.check_is_event_shared_with_user(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calendar_event_shares 
    WHERE event_id = _event_id 
    AND (shared_with_user_id = _user_id OR shared_with_team_id = get_user_team_id(_user_id))
  );
$$;

-- Update calendar_event_shares policies
DROP POLICY IF EXISTS "Event owners manage shares" ON public.calendar_event_shares;
CREATE POLICY "Event owners manage shares" ON public.calendar_event_shares
FOR ALL USING (check_is_event_owner(event_id, auth.uid()))
WITH CHECK (check_is_event_owner(event_id, auth.uid()));

-- Update calendar_events policies
DROP POLICY IF EXISTS "Users see shared events" ON public.calendar_events;
CREATE POLICY "Users see shared events" ON public.calendar_events
FOR SELECT USING (check_is_event_shared_with_user(id, auth.uid()));

DROP POLICY IF EXISTS "Users see team shared events" ON public.calendar_events;
-- This one is already covered by check_is_event_shared_with_user if we want to simplify, 
-- but we can keep it separate or just remove it if the other covers it.
-- Let's remove the redundant ones to keep it clean.
