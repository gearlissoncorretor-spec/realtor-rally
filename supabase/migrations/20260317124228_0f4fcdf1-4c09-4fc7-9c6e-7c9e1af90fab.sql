-- Fix 1: calendar_events - change company_isolation_events from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation_events" ON public.calendar_events;
CREATE POLICY "company_isolation_events" ON public.calendar_events
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Fix 2: negotiation_notes - change company_isolation_notes from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation_notes" ON public.negotiation_notes;
CREATE POLICY "company_isolation_notes" ON public.negotiation_notes
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Fix 3: negotiation_statuses - change company_isolation from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation" ON public.negotiation_statuses;
CREATE POLICY "company_isolation" ON public.negotiation_statuses
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Fix 4: calendar_event_shares - change company_isolation_shares from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "company_isolation_shares" ON public.calendar_event_shares;
CREATE POLICY "company_isolation_shares" ON public.calendar_event_shares
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));