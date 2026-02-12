-- Allow directors and managers to also manage process stages
CREATE POLICY "Directors and managers can manage process stages"
ON public.process_stages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('diretor', 'gerente')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('diretor', 'gerente')
  )
);