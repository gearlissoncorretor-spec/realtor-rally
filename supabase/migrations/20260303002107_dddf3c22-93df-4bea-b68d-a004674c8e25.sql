
-- =============================================
-- FIX: Remove RESTRICTIVE "Deny public access" policies that block ALL access
-- These policies use USING(false) as RESTRICTIVE, which overrides all other policies
-- =============================================

-- Fix brokers table
DROP POLICY IF EXISTS "Deny public access to brokers" ON public.brokers;

-- Fix sales table  
DROP POLICY IF EXISTS "Deny public access to sales" ON public.sales;

-- =============================================
-- FIX: Replace manager policies that reference profiles directly (causes recursion)
-- Use get_user_team_id() security definer function instead
-- =============================================

-- Fix brokers: Managers can create brokers in their team
DROP POLICY IF EXISTS "Managers can create brokers in their team" ON public.brokers;
CREATE POLICY "Managers can create brokers in their team"
ON public.brokers FOR INSERT
WITH CHECK (
  ((get_user_role(auth.uid()) = 'gerente'::text) AND (team_id = get_user_team_id(auth.uid())))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
);

-- Fix brokers: Managers can update their team brokers
DROP POLICY IF EXISTS "Managers can update their team brokers" ON public.brokers;
CREATE POLICY "Managers can update their team brokers"
ON public.brokers FOR UPDATE
USING (
  ((get_user_role(auth.uid()) = 'gerente'::text) AND (team_id = get_user_team_id(auth.uid())))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
  OR (user_id = auth.uid())
);

-- Fix brokers: Managers can view their team brokers
DROP POLICY IF EXISTS "Managers can view their team brokers" ON public.brokers;
CREATE POLICY "Managers can view their team brokers"
ON public.brokers FOR SELECT
USING (
  ((get_user_role(auth.uid()) = 'gerente'::text) AND (team_id = get_user_team_id(auth.uid())))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
  OR (user_id = auth.uid())
);

-- Fix sales: Managers can manage their team sales
DROP POLICY IF EXISTS "Managers can manage their team sales" ON public.sales;
CREATE POLICY "Managers can manage their team sales"
ON public.sales FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

-- Fix sales: Managers can view their team sales
DROP POLICY IF EXISTS "Managers can view their team sales" ON public.sales;
CREATE POLICY "Managers can view their team sales"
ON public.sales FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

-- =============================================
-- Fix targets table manager policies
-- =============================================
DROP POLICY IF EXISTS "Managers can manage their team targets" ON public.targets;
CREATE POLICY "Managers can manage their team targets"
ON public.targets FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

DROP POLICY IF EXISTS "Managers can view their team targets" ON public.targets;
CREATE POLICY "Managers can view their team targets"
ON public.targets FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

-- =============================================
-- Fix goals table manager policies
-- =============================================
DROP POLICY IF EXISTS "Directors and managers can create goals" ON public.goals;
CREATE POLICY "Directors and managers can create goals"
ON public.goals FOR INSERT
WITH CHECK (
  (get_current_user_admin_status() = true)
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR ((get_user_role(auth.uid()) = 'gerente'::text) AND ((team_id IS NULL) OR (team_id = get_user_team_id(auth.uid()))))
);

DROP POLICY IF EXISTS "Directors and managers can delete goals" ON public.goals;
CREATE POLICY "Directors and managers can delete goals"
ON public.goals FOR DELETE
USING (
  (get_current_user_admin_status() = true)
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR ((get_user_role(auth.uid()) = 'gerente'::text) AND ((team_id IS NULL) OR (team_id = get_user_team_id(auth.uid()))))
);

DROP POLICY IF EXISTS "Directors and managers can update goals" ON public.goals;
CREATE POLICY "Directors and managers can update goals"
ON public.goals FOR UPDATE
USING (
  (get_current_user_admin_status() = true)
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR ((get_user_role(auth.uid()) = 'gerente'::text) AND ((team_id IS NULL) OR (team_id = get_user_team_id(auth.uid()))))
  OR (assigned_to = auth.uid())
)
WITH CHECK (
  (get_current_user_admin_status() = true)
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR ((get_user_role(auth.uid()) = 'gerente'::text) AND ((team_id IS NULL) OR (team_id = get_user_team_id(auth.uid()))))
  OR (assigned_to = auth.uid())
);

DROP POLICY IF EXISTS "Managers can view team goals" ON public.goals;
CREATE POLICY "Managers can view team goals"
ON public.goals FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (
    (team_id = get_user_team_id(auth.uid()))
    OR (assigned_to IN (
      SELECT p.id FROM profiles p WHERE p.team_id = get_user_team_id(auth.uid())
    ))
  )
);

-- =============================================
-- Fix follow_ups manager policies
-- =============================================
DROP POLICY IF EXISTS "Users can view follow_ups based on role" ON public.follow_ups;
CREATE POLICY "Users can view follow_ups based on role"
ON public.follow_ups FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'diretor'::app_role)
  OR (has_role(auth.uid(), 'gerente'::app_role) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  OR (broker_id IN (SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can update follow_ups based on role" ON public.follow_ups;
CREATE POLICY "Users can update follow_ups based on role"
ON public.follow_ups FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'diretor'::app_role)
  OR (has_role(auth.uid(), 'gerente'::app_role) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  OR (broker_id IN (SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete follow_ups based on role" ON public.follow_ups;
CREATE POLICY "Users can delete follow_ups based on role"
ON public.follow_ups FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'diretor'::app_role)
  OR (has_role(auth.uid(), 'gerente'::app_role) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  OR (broker_id IN (SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()))
);

-- =============================================
-- Fix negotiation manager policies  
-- =============================================
DROP POLICY IF EXISTS "Managers can manage team negotiations" ON public.negotiations;
CREATE POLICY "Managers can manage team negotiations"
ON public.negotiations FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

DROP POLICY IF EXISTS "Managers can view team negotiations" ON public.negotiations;
CREATE POLICY "Managers can view team negotiations"
ON public.negotiations FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

-- =============================================
-- Fix broker_activities manager policies
-- =============================================
DROP POLICY IF EXISTS "Managers can manage team activities" ON public.broker_activities;
CREATE POLICY "Managers can manage team activities"
ON public.broker_activities FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

DROP POLICY IF EXISTS "Managers can view team activities" ON public.broker_activities;
CREATE POLICY "Managers can view team activities"
ON public.broker_activities FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

-- =============================================
-- Fix broker_tasks manager policies
-- =============================================
DROP POLICY IF EXISTS "Managers can view their team tasks" ON public.broker_tasks;
CREATE POLICY "Managers can view their team tasks"
ON public.broker_tasks FOR SELECT
USING (
  ((get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
);

DROP POLICY IF EXISTS "Users can update accessible tasks" ON public.broker_tasks;
CREATE POLICY "Users can update accessible tasks"
ON public.broker_tasks FOR UPDATE
USING (
  (broker_id IN (SELECT brokers.id FROM brokers WHERE brokers.user_id = auth.uid()))
  OR ((get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )))
  OR (get_user_role(auth.uid()) = 'diretor'::text)
  OR (get_current_user_admin_status() = true)
);

-- =============================================
-- Fix broker_weekly_activities manager policies
-- =============================================
DROP POLICY IF EXISTS "Managers can manage team weekly activities" ON public.broker_weekly_activities;
CREATE POLICY "Managers can manage team weekly activities"
ON public.broker_weekly_activities FOR ALL
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);

DROP POLICY IF EXISTS "Managers can view team weekly activities" ON public.broker_weekly_activities;
CREATE POLICY "Managers can view team weekly activities"
ON public.broker_weekly_activities FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente'::text) AND (broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  ))
);
