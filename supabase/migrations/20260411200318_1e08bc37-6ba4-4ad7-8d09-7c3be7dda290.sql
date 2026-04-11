
-- Fix 1: Prevent diretor from assigning 'admin' or 'socio' roles (privilege escalation)
DROP POLICY IF EXISTS "Directors can manage non-admin roles in own company" ON public.user_roles;

CREATE POLICY "Directors can manage non-admin roles in own company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  ((get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  AND (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.company_id = get_user_company_id(auth.uid())))
  AND role NOT IN ('super_admin', 'admin', 'socio'))
)
WITH CHECK (
  ((get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status())
  AND (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.company_id = get_user_company_id(auth.uid())))
  AND role NOT IN ('super_admin', 'admin', 'socio'))
);

-- Fix 2: Tighten follow_ups INSERT to enforce broker_id ownership for non-privileged roles
DROP POLICY IF EXISTS "Users can insert follow_ups" ON public.follow_ups;

CREATE POLICY "Users can insert follow_ups"
ON public.follow_ups
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'diretor') 
  OR (has_role(auth.uid(), 'gerente') AND broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
  OR (broker_id IN (
    SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()
  ))
);

-- Fix 3: Tighten follow_up_contacts policies to properly filter by accessible follow_ups
DROP POLICY IF EXISTS "Authenticated users can view contacts based on follow_up access" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert contacts for accessible follow_u" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts for accessible follow_u" ON public.follow_up_contacts;

CREATE POLICY "Users can view follow_up_contacts"
ON public.follow_up_contacts
FOR SELECT
TO authenticated
USING (
  follow_up_id IN (
    SELECT fu.id FROM follow_ups fu
    WHERE has_role(auth.uid(), 'admin') 
      OR has_role(auth.uid(), 'diretor')
      OR (has_role(auth.uid(), 'gerente') AND fu.broker_id IN (
        SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
      ))
      OR fu.broker_id IN (
        SELECT b2.id FROM brokers b2 WHERE b2.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users can insert follow_up_contacts"
ON public.follow_up_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  follow_up_id IN (
    SELECT fu.id FROM follow_ups fu
    WHERE has_role(auth.uid(), 'admin') 
      OR has_role(auth.uid(), 'diretor')
      OR (has_role(auth.uid(), 'gerente') AND fu.broker_id IN (
        SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
      ))
      OR fu.broker_id IN (
        SELECT b2.id FROM brokers b2 WHERE b2.user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users can delete follow_up_contacts"
ON public.follow_up_contacts
FOR DELETE
TO authenticated
USING (
  follow_up_id IN (
    SELECT fu.id FROM follow_ups fu
    WHERE has_role(auth.uid(), 'admin') 
      OR has_role(auth.uid(), 'diretor')
      OR (has_role(auth.uid(), 'gerente') AND fu.broker_id IN (
        SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
      ))
      OR fu.broker_id IN (
        SELECT b2.id FROM brokers b2 WHERE b2.user_id = auth.uid()
      )
  )
);
