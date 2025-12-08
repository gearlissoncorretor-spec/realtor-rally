-- Create broker_tasks table for Kanban tasks
CREATE TABLE public.broker_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.process_stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  property_reference TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.broker_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.broker_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_history table for audit trail
CREATE TABLE public.task_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.broker_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create column_targets for weekly goals per column
CREATE TABLE public.column_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.process_stages(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(broker_id, column_id, week_start)
);

-- Enable RLS on all tables
ALTER TABLE public.broker_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broker_tasks
CREATE POLICY "Brokers can view their own tasks"
ON public.broker_tasks FOR SELECT
USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

CREATE POLICY "Managers can view their team tasks"
ON public.broker_tasks FOR SELECT
USING (
  (get_user_role(auth.uid()) = 'gerente' AND broker_id IN (
    SELECT b.id FROM brokers b
    JOIN profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  ))
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
);

CREATE POLICY "Managers and directors can create tasks"
ON public.broker_tasks FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('gerente', 'diretor')
  OR get_current_user_admin_status() = true
  OR broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update accessible tasks"
ON public.broker_tasks FOR UPDATE
USING (
  broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
  OR (get_user_role(auth.uid()) = 'gerente' AND broker_id IN (
    SELECT b.id FROM brokers b
    JOIN profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  ))
  OR get_user_role(auth.uid()) = 'diretor'
  OR get_current_user_admin_status() = true
);

CREATE POLICY "Managers and directors can delete tasks"
ON public.broker_tasks FOR DELETE
USING (
  get_user_role(auth.uid()) IN ('gerente', 'diretor')
  OR get_current_user_admin_status() = true
);

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments on accessible tasks"
ON public.task_comments FOR SELECT
USING (task_id IN (SELECT id FROM broker_tasks));

CREATE POLICY "Authenticated users can create comments"
ON public.task_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND task_id IN (SELECT id FROM broker_tasks));

CREATE POLICY "Users can delete their own comments"
ON public.task_comments FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments on accessible tasks"
ON public.task_attachments FOR SELECT
USING (task_id IN (SELECT id FROM broker_tasks));

CREATE POLICY "Authenticated users can upload attachments"
ON public.task_attachments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND task_id IN (SELECT id FROM broker_tasks));

CREATE POLICY "Users can delete their own attachments"
ON public.task_attachments FOR DELETE
USING (uploaded_by = auth.uid() OR get_current_user_admin_status() = true);

-- RLS Policies for task_history
CREATE POLICY "Users can view history of accessible tasks"
ON public.task_history FOR SELECT
USING (task_id IN (SELECT id FROM broker_tasks));

CREATE POLICY "System can insert history"
ON public.task_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for column_targets
CREATE POLICY "Users can view their targets"
ON public.column_targets FOR SELECT
USING (
  broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
  OR get_user_role(auth.uid()) IN ('gerente', 'diretor')
  OR get_current_user_admin_status() = true
);

CREATE POLICY "Managers can manage targets"
ON public.column_targets FOR ALL
USING (
  get_user_role(auth.uid()) IN ('gerente', 'diretor')
  OR get_current_user_admin_status() = true
);

-- Create trigger for updated_at
CREATE TRIGGER update_broker_tasks_updated_at
BEFORE UPDATE ON public.broker_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_column_targets_updated_at
BEFORE UPDATE ON public.column_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Kanban columns if process_stages is empty
INSERT INTO public.process_stages (title, color, order_index, is_default)
SELECT * FROM (VALUES
  ('Visitas', '#3b82f6', 0, true),
  ('Grupo de Provações', '#8b5cf6', 1, false),
  ('Ações de Rua', '#f59e0b', 2, false),
  ('Follow-up', '#10b981', 3, false),
  ('Agendamentos', '#06b6d4', 4, false),
  ('Propostas Enviadas', '#ec4899', 5, false),
  ('Pós-atendimento', '#6366f1', 6, false),
  ('Fechamentos', '#22c55e', 7, false)
) AS v(title, color, order_index, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.process_stages LIMIT 1);

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task attachments
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);