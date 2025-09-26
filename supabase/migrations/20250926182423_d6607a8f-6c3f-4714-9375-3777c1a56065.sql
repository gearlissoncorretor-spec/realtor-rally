-- Create enhanced goals table for advanced targets
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  target_type TEXT NOT NULL CHECK (target_type IN ('sales_count', 'revenue', 'vgv', 'commission')),
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id),
  broker_id UUID REFERENCES public.brokers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal tasks table
CREATE TABLE public.goal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('action', 'milestone', 'training', 'meeting')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal progress tracking table
CREATE TABLE public.goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  progress_value NUMERIC NOT NULL DEFAULT 0,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals table
CREATE POLICY "Directors can view all goals" ON public.goals FOR SELECT
USING (get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status());

CREATE POLICY "Managers can view team goals" ON public.goals FOR SELECT
USING (
  get_user_role(auth.uid()) = 'gerente' AND 
  (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()) OR 
   assigned_to IN (SELECT id FROM profiles WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())))
);

CREATE POLICY "Brokers can view their own goals" ON public.goals FOR SELECT
USING (
  assigned_to = auth.uid() OR 
  broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Directors and managers can create goals" ON public.goals FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status()
);

CREATE POLICY "Directors and managers can update goals" ON public.goals FOR UPDATE
USING (
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status() OR
  assigned_to = auth.uid()
);

CREATE POLICY "Directors and managers can delete goals" ON public.goals FOR DELETE
USING (
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status()
);

-- RLS Policies for goal_tasks table
CREATE POLICY "Users can view tasks for their accessible goals" ON public.goal_tasks FOR SELECT
USING (
  goal_id IN (SELECT id FROM goals) OR -- This will respect the goals policies
  assigned_to = auth.uid()
);

CREATE POLICY "Managers and directors can create tasks" ON public.goal_tasks FOR INSERT
WITH CHECK (
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status()
);

CREATE POLICY "Users can update their assigned tasks" ON public.goal_tasks FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status()
);

CREATE POLICY "Managers and directors can delete tasks" ON public.goal_tasks FOR DELETE
USING (
  get_user_role(auth.uid()) IN ('diretor', 'gerente') OR 
  get_current_user_admin_status()
);

-- RLS Policies for goal_progress table
CREATE POLICY "Users can view progress for their accessible goals" ON public.goal_progress FOR SELECT
USING (goal_id IN (SELECT id FROM goals)); -- This will respect the goals policies

CREATE POLICY "All authenticated users can create progress" ON public.goal_progress FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own progress entries" ON public.goal_progress FOR UPDATE
USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_goals_assigned_to ON public.goals(assigned_to);
CREATE INDEX idx_goals_team_id ON public.goals(team_id);
CREATE INDEX idx_goals_broker_id ON public.goals(broker_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_period ON public.goals(start_date, end_date);

CREATE INDEX idx_goal_tasks_goal_id ON public.goal_tasks(goal_id);
CREATE INDEX idx_goal_tasks_assigned_to ON public.goal_tasks(assigned_to);
CREATE INDEX idx_goal_tasks_status ON public.goal_tasks(status);

CREATE INDEX idx_goal_progress_goal_id ON public.goal_progress(goal_id);
CREATE INDEX idx_goal_progress_date ON public.goal_progress(progress_date);

-- Create triggers for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_tasks_updated_at
  BEFORE UPDATE ON public.goal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();