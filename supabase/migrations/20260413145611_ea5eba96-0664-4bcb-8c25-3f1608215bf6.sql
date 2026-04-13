-- Helper function to check if a user is the manager of another user
CREATE OR REPLACE FUNCTION public.is_manager_of_user(manager_uid UUID, target_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    WHERE p.id = target_uid 
    AND (p.manager_id = manager_uid OR t.manager_id = manager_uid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update follow_ups policies
DROP POLICY IF EXISTS "fu_view" ON public.follow_ups;
CREATE POLICY "fu_view" ON public.follow_ups
FOR SELECT
USING (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "fu_insert" ON public.follow_ups;
CREATE POLICY "fu_insert" ON public.follow_ups
FOR INSERT
WITH CHECK (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "fu_update" ON public.follow_ups;
CREATE POLICY "fu_update" ON public.follow_ups
FOR UPDATE
USING (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

-- Update follow_up_notes policies
DROP POLICY IF EXISTS "fun_view" ON public.follow_up_notes;
CREATE POLICY "fun_view" ON public.follow_up_notes
FOR SELECT
USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (
    SELECT id FROM follow_ups 
    WHERE created_by = auth.uid() 
    OR broker_id IN (SELECT bid.id FROM brokers bid WHERE bid.user_id = auth.uid())
    OR public.is_manager_of_user(auth.uid(), created_by)
  ))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

-- Update follow_up_contacts policies
DROP POLICY IF EXISTS "fuc_view" ON public.follow_up_contacts;
CREATE POLICY "fuc_view" ON public.follow_up_contacts
FOR SELECT
USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (
    SELECT id FROM follow_ups 
    WHERE created_by = auth.uid() 
    OR broker_id IN (SELECT bid.id FROM brokers bid WHERE bid.user_id = auth.uid())
    OR public.is_manager_of_user(auth.uid(), created_by)
  ))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);