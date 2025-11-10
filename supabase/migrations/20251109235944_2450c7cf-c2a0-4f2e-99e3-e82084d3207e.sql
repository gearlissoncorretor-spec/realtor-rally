-- ========================================
-- MIGRATION: Limpeza de roles da tabela profiles (CORRIGIDA)
-- OBJETIVO: Remover colunas role e is_admin, forçar uso de user_roles
-- ========================================

-- 1. Garantir que todos os usuários existentes têm role em user_roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT p.id, COALESCE(p.role::app_role, 'corretor'::app_role)
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 2. ATUALIZAR POLICIES DE SALES para usar has_role ao invés de is_admin
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can manage all sales" ON public.sales;

CREATE POLICY "Admins can view all sales" 
ON public.sales 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all sales" 
ON public.sales 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. ATUALIZAR POLICIES DE BROKERS para usar has_role
DROP POLICY IF EXISTS "Admins can view all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Only admins can create brokers" ON public.brokers;
DROP POLICY IF EXISTS "Admins can update all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Only admins can delete brokers" ON public.brokers;

CREATE POLICY "Admins can view all brokers" 
ON public.brokers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can create brokers" 
ON public.brokers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all brokers" 
ON public.brokers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete brokers" 
ON public.brokers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 4. ATUALIZAR POLICIES DE BROKER_NOTES para usar has_role
DROP POLICY IF EXISTS "Admins can view all notes" ON public.broker_notes;
DROP POLICY IF EXISTS "Admins can create notes" ON public.broker_notes;
DROP POLICY IF EXISTS "Admins can update notes" ON public.broker_notes;
DROP POLICY IF EXISTS "Admins can delete notes" ON public.broker_notes;

CREATE POLICY "Admins can view all notes" 
ON public.broker_notes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create notes" 
ON public.broker_notes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notes" 
ON public.broker_notes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notes" 
ON public.broker_notes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 5. AGORA podemos remover as colunas obsoletas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- 6. Atualizar trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
  default_role app_role;
  default_screens TEXT[];
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    default_role := 'admin';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas'];
  END IF;
  
  INSERT INTO public.profiles (id, full_name, email, allowed_screens, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 7. Atualizar função prevent_privilege_escalation
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.approved IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT has_role(auth.uid(), 'admin') AND (
    (OLD.approved IS DISTINCT FROM NEW.approved) OR
    (OLD.allowed_screens IS DISTINCT FROM NEW.allowed_screens)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify approval or allowed screens';
  END IF;
  
  IF auth.uid() != NEW.id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Atualizar get_current_user_admin_status
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;

-- 9. Remover função obsoleta is_user_admin
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ========================================
-- MIGRATION CONCLUÍDA COM SUCESSO
-- ========================================