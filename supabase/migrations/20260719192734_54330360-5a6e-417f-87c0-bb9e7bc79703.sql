
-- 1. campaigns: scope broker view to company
DROP POLICY IF EXISTS "brokers_view_active_campaigns" ON public.campaigns;
CREATE POLICY "brokers_view_active_campaigns" ON public.campaigns
FOR SELECT TO authenticated
USING (
  status = ANY (ARRAY['active','paused','finished'])
  AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
);

-- 2. organization_settings: restrict update to admin/diretor within same company
DROP POLICY IF EXISTS "Admins directors and managers can update settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Admins directors and managers can insert settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Admins can update organization settings" ON public.organization_settings;

CREATE POLICY "Admins and directors can update settings" ON public.organization_settings
FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'diretor'::app_role))
  AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'diretor'::app_role))
  AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
);

CREATE POLICY "Admins and directors can insert settings" ON public.organization_settings
FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'diretor'::app_role))
  AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
);

-- 3. storage.objects: task-attachments upload requires user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload task attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. task_comments: INSERT scoped to tasks in user's company
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.task_comments;
CREATE POLICY "Authenticated users can create comments" ON public.task_comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin(auth.uid()))
  AND task_id IN (
    SELECT bt.id FROM public.broker_tasks bt
    WHERE bt.company_id = public.get_user_company_id(auth.uid())
       OR public.is_super_admin(auth.uid())
  )
);
