
-- Directors and admins can manage all targets in their company
CREATE POLICY "Directors and admins can manage all targets"
  ON public.targets FOR ALL
  TO authenticated
  USING (
    (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true)
  )
  WITH CHECK (
    (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true)
  );
