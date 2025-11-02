-- Remove a constraint antiga de role da tabela profiles
-- O sistema agora usa a tabela user_roles para gerenciar roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;