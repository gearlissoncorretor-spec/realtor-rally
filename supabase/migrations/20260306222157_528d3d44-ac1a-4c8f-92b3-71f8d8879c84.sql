
-- Promote to super_admin (remove old role, add super_admin)
DELETE FROM public.user_roles WHERE user_id = '3c4f3dd0-b102-4be6-9e72-4095e6b312f0';

INSERT INTO public.user_roles (user_id, role)
VALUES ('3c4f3dd0-b102-4be6-9e72-4095e6b312f0', 'super_admin');

-- Approve and grant all screens
UPDATE public.profiles
SET approved = true,
    approved_at = now(),
    allowed_screens = ARRAY['dashboard','vendas','corretores','ranking','acompanhamento','relatorios','configuracoes','equipes','metas','negociacoes','follow-up','atividades','tarefas-kanban','meta-gestao','x1','dashboard-equipes','agenda','gestao-usuarios','super-admin']
WHERE id = '3c4f3dd0-b102-4be6-9e72-4095e6b312f0';
