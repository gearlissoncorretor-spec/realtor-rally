-- ========================================
-- CORREÇÃO CRÍTICA: Atualizar get_team_hierarchy
-- PROBLEMA: Função ainda usa p.role que foi removido
-- ========================================

-- Recriar função get_team_hierarchy usando user_roles
CREATE OR REPLACE FUNCTION public.get_team_hierarchy(user_id uuid)
RETURNS TABLE(team_id uuid, team_name text, is_manager boolean, team_members uuid[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH user_info AS (
    SELECT 
      p.id,
      p.team_id,
      t.name as team_name,
      get_user_primary_role(p.id) as user_role
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    WHERE p.id = user_id
  )
  SELECT 
    ui.team_id,
    ui.team_name,
    (ui.user_role = 'gerente'),
    CASE 
      WHEN ui.user_role IN ('diretor', 'admin') THEN 
        ARRAY(SELECT id FROM public.profiles WHERE team_id IS NOT NULL)
      WHEN ui.user_role = 'gerente' THEN 
        ARRAY(SELECT id FROM public.profiles WHERE team_id = ui.team_id)
      ELSE 
        ARRAY[user_id]
    END as team_members
  FROM user_info ui;
$$;

-- ========================================
-- CORREÇÃO CONCLUÍDA
-- ========================================