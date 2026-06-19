
-- Permitir exclusão por Corretor (próprios), Gerente e Diretor em follow_ups, leads e negotiations

-- FOLLOW_UPS: substitui política antiga
DROP POLICY IF EXISTS "leads_delete_policy" ON public.follow_ups;
CREATE POLICY "follow_ups_delete_policy" ON public.follow_ups
FOR DELETE TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'socio'::app_role)
    OR has_role(auth.uid(), 'diretor'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.brokers b WHERE b.id = follow_ups.broker_id AND b.user_id = auth.uid())
  )
);

-- LEADS: adiciona corretor (próprios leads)
DROP POLICY IF EXISTS "Admins and managers can delete leads" ON public.leads;
CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'socio'::app_role)
    OR has_role(auth.uid(), 'diretor'::app_role)
    OR has_role(auth.uid(), 'gerente'::app_role)
    OR user_id = auth.uid()
    OR created_by = auth.uid()
  )
);

-- NEGOTIATIONS: adiciona gerente (company-wide) mantendo corretor por broker/created_by
DROP POLICY IF EXISTS "neg_delete" ON public.negotiations;
CREATE POLICY "negotiations_delete_policy" ON public.negotiations
FOR DELETE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    company_id = get_user_company_id(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'socio'::app_role)
      OR has_role(auth.uid(), 'diretor'::app_role)
      OR has_role(auth.uid(), 'gerente'::app_role)
      OR created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.brokers b WHERE b.id = negotiations.broker_id AND b.user_id = auth.uid())
    )
  )
);
