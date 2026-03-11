
-- Update all existing gerentes to have access to all non-admin screens
UPDATE profiles
SET allowed_screens = ARRAY[
  'dashboard', 'vendas', 'corretores', 'equipes', 'ranking', 
  'metas', 'acompanhamento', 'relatorios', 'x1', 'dashboard-equipes',
  'tarefas-kanban', 'atividades', 'negociacoes', 'follow-up', 
  'meta-gestao', 'configuracoes', 'agenda', 'comissoes', 'instalar'
]
WHERE id IN (
  SELECT user_id FROM user_roles WHERE role = 'gerente'
);
