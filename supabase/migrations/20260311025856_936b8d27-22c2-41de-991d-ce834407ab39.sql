
-- Fix brokers SELECT policies: change role-based ones to PERMISSIVE
-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can view all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Directors can view all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can view their own data" ON public.brokers;
DROP POLICY IF EXISTS "Managers can view their team brokers" ON public.brokers;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can view all brokers"
  ON public.brokers FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Directors can view all brokers"
  ON public.brokers FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'diretor'::text);

CREATE POLICY "Brokers can view their own data"
  ON public.brokers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view their team brokers"
  ON public.brokers FOR SELECT
  TO public
  USING (
    (get_user_role(auth.uid()) = 'gerente'::text AND team_id = get_user_team_id(auth.uid()))
    OR get_user_role(auth.uid()) = 'diretor'::text
    OR get_current_user_admin_status() = true
    OR user_id = auth.uid()
  );
