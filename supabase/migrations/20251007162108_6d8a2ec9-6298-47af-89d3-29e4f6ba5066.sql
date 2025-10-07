-- Adicionar campos quantitativos às tarefas para controle de metas diárias por corretor

-- Adicionar colunas para controle de quantidade (meta vs realizado)
ALTER TABLE public.goal_tasks
ADD COLUMN IF NOT EXISTS target_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS task_category TEXT DEFAULT 'geral';

-- Criar comentários para documentação
COMMENT ON COLUMN public.goal_tasks.target_quantity IS 'Meta de quantidade a ser atingida (ex: 10 ligações)';
COMMENT ON COLUMN public.goal_tasks.completed_quantity IS 'Quantidade efetivamente realizada';
COMMENT ON COLUMN public.goal_tasks.task_category IS 'Categoria da tarefa (ligacoes, atendimentos, visitas, etc)';

-- Criar índice para melhorar performance de consultas por data e corretor
CREATE INDEX IF NOT EXISTS idx_goal_tasks_assigned_due_date 
ON public.goal_tasks(assigned_to, due_date) 
WHERE status != 'completed';