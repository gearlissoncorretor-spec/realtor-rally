-- Drop a constraint UNIQUE(user_id) que está bloqueando múltiplos roles e impedindo o ON CONFLICT (user_id, role) da trigger handle_new_user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- Adicionar a constraint composta correta para o ON CONFLICT da trigger
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);