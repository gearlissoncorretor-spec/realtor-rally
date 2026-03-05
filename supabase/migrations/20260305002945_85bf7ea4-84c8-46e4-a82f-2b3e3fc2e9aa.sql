
-- Companies table policies
CREATE POLICY "super_admins_manage_companies" ON public.companies
FOR ALL TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "users_view_own_company" ON public.companies
FOR SELECT TO authenticated
USING (id = get_user_company_id(auth.uid()));

-- RESTRICTIVE company isolation policies (ANDed with existing permissive policies)
CREATE POLICY "company_isolation" ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.brokers AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.teams AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.sales AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.negotiations AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.follow_ups AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.goals AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.goal_tasks AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.goal_progress AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.broker_activities AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.broker_tasks AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.broker_weekly_activities AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.broker_notes AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.targets AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.organization_settings AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.process_stages AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.follow_up_statuses AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.follow_up_contacts AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.column_targets AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.task_attachments AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.task_comments AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "company_isolation" ON public.task_history AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Update handle_new_user to include company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  default_role app_role;
  default_screens TEXT[];
  target_company_id uuid;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Get company_id from metadata (set by admin/super_admin during creation)
  target_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  
  -- Fallback to first company if not specified
  IF target_company_id IS NULL THEN
    SELECT id INTO target_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
  END IF;
  
  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas'];
  END IF;
  
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END,
    target_company_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
