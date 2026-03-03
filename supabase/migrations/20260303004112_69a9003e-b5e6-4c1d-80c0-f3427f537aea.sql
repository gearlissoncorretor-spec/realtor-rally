
-- Adicionar novos campos ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

-- Criar índice para buscas por status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Criar índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles USING gin(to_tsvector('portuguese', full_name));

-- Adicionar campo last_login_at para rastreamento
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

-- Remover o role 'user' do enum (converter existentes para 'corretor')
UPDATE public.user_roles SET role = 'corretor' WHERE role = 'user';
