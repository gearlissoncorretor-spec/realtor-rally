-- CORREÇÃO CRÍTICA DE SEGURANÇA: Restringir acesso à tabela brokers

-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "Allow all operations on brokers" ON public.brokers;
DROP POLICY IF EXISTS "Everyone can view brokers" ON public.brokers;

-- Criar políticas seguras que exigem autenticação
CREATE POLICY "Authenticated users can view brokers" 
ON public.brokers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create brokers" 
ON public.brokers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update brokers" 
ON public.brokers 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brokers" 
ON public.brokers 
FOR DELETE 
TO authenticated 
USING (true);