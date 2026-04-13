-- 1. Unify follow_ups policies
DROP POLICY IF EXISTS "fu_view" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_insert" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_update" ON public.follow_ups;
DROP POLICY IF EXISTS "fu_delete" ON public.follow_ups;

CREATE POLICY "fu_view" ON public.follow_ups FOR SELECT USING (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

CREATE POLICY "fu_insert" ON public.follow_ups FOR INSERT WITH CHECK (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

CREATE POLICY "fu_update" ON public.follow_ups FOR UPDATE USING (
  (created_by = auth.uid()) 
  OR (broker_id IN (SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()))
  OR (public.is_manager_of_user(auth.uid(), created_by))
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

CREATE POLICY "fu_delete" ON public.follow_ups FOR DELETE USING (
  (created_by = auth.uid()) 
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

-- 2. Unify follow_up_notes policies
DROP POLICY IF EXISTS "fun_view" ON public.follow_up_notes;
DROP POLICY IF EXISTS "fun_insert" ON public.follow_up_notes;
DROP POLICY IF EXISTS "Users can delete follow_up notes" ON public.follow_up_notes;

CREATE POLICY "fun_view" ON public.follow_up_notes FOR SELECT USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups)) -- The follow_ups policy already filters what they can see
);

CREATE POLICY "fun_insert" ON public.follow_up_notes FOR INSERT WITH CHECK (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups)) -- The follow_ups policy already filters what they can modify
);

CREATE POLICY "fun_update" ON public.follow_up_notes FOR UPDATE USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups))
);

CREATE POLICY "fun_delete" ON public.follow_up_notes FOR DELETE USING (
  (created_by = auth.uid()) 
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);

-- 3. Unify follow_up_contacts policies
DROP POLICY IF EXISTS "fuc_view" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Users can view follow_up_contacts" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Users can insert follow_up_contacts" ON public.follow_up_contacts;
DROP POLICY IF EXISTS "Users can delete follow_up_contacts" ON public.follow_up_contacts;

CREATE POLICY "fuc_view" ON public.follow_up_contacts FOR SELECT USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups))
);

CREATE POLICY "fuc_insert" ON public.follow_up_contacts FOR INSERT WITH CHECK (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups))
);

CREATE POLICY "fuc_update" ON public.follow_up_contacts FOR UPDATE USING (
  (created_by = auth.uid()) 
  OR (follow_up_id IN (SELECT id FROM follow_ups))
);

CREATE POLICY "fuc_delete" ON public.follow_up_contacts FOR DELETE USING (
  (created_by = auth.uid()) 
  OR (get_user_role(auth.uid()) = ANY (ARRAY['diretor'::text, 'admin'::text, 'socio'::text]))
  OR is_super_admin(auth.uid())
);