-- 1. Fix follow_up_contacts: change policies from public to authenticated
DROP POLICY IF EXISTS "Users can view contacts based on follow_up access" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Users can insert contacts for accessible follow_ups" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for accessible follow_ups" ON public.follow_up_contacts;

CREATE POLICY "Authenticated users can view contacts based on follow_up access"
ON public.follow_up_contacts FOR SELECT TO authenticated
USING (follow_up_id IN (SELECT id FROM follow_ups));

CREATE POLICY "Authenticated users can insert contacts for accessible follow_ups"
ON public.follow_up_contacts FOR INSERT TO authenticated
WITH CHECK (follow_up_id IN (SELECT id FROM follow_ups));

CREATE POLICY "Authenticated users can delete contacts for accessible follow_ups"
ON public.follow_up_contacts FOR DELETE TO authenticated
USING (follow_up_id IN (SELECT id FROM follow_ups));

-- 2. Fix process_stages: drop old public policy if still exists
DROP POLICY IF EXISTS "Everyone can view process stages" ON public.process_stages;

-- 3. Fix brokers: remove confusing restrictive deny-all policy
DROP POLICY IF EXISTS "Deny public access to brokers" ON public.brokers;