-- Fix Guilherme Alvarenga: remove incorrect roles and assign 'socio'
DELETE FROM public.user_roles WHERE user_id = '6f442dce-8df4-4b87-9111-7b1eafe0cafc';
INSERT INTO public.user_roles (user_id, role) VALUES ('6f442dce-8df4-4b87-9111-7b1eafe0cafc', 'socio');

-- Also update allowed_screens to full access for socio
UPDATE public.profiles
SET allowed_screens = ARRAY[
  'dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento',
  'relatorios', 'configuracoes', 'equipes', 'metas', 'central-gestor',
  'atividades', 'negociacoes', 'follow-up', 'meta-gestao', 'agenda',
  'instalar', 'gestao-usuarios', 'comissoes', 'dashboard-equipes', 'x1'
]
WHERE id = '6f442dce-8df4-4b87-9111-7b1eafe0cafc';