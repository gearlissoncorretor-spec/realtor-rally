-- Atualizar a constraint de role para aceitar os valores corretos
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'diretor'::text, 'gerente'::text, 'corretor'::text, 'cliente'::text]));