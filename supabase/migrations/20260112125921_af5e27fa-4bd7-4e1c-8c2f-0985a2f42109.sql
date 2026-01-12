-- Create table for weekly broker activities
CREATE TABLE public.broker_weekly_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  meta_semanal INTEGER NOT NULL DEFAULT 0,
  realizado INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_broker_weekly_activities_broker_id ON public.broker_weekly_activities(broker_id);
CREATE INDEX idx_broker_weekly_activities_week_start ON public.broker_weekly_activities(week_start);

-- Enable RLS
ALTER TABLE public.broker_weekly_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Brokers can view their own activities
CREATE POLICY "Brokers can view their own weekly activities"
ON public.broker_weekly_activities
FOR SELECT
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Brokers can manage their own activities
CREATE POLICY "Brokers can manage their own weekly activities"
ON public.broker_weekly_activities
FOR ALL
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Managers can view their team's activities
CREATE POLICY "Managers can view team weekly activities"
ON public.broker_weekly_activities
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'gerente' AND
  broker_id IN (
    SELECT b.id FROM public.brokers b
    JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);

-- Managers can manage their team's activities
CREATE POLICY "Managers can manage team weekly activities"
ON public.broker_weekly_activities
FOR ALL
USING (
  get_user_role(auth.uid()) = 'gerente' AND
  broker_id IN (
    SELECT b.id FROM public.brokers b
    JOIN public.profiles p ON b.team_id = p.team_id
    WHERE p.id = auth.uid()
  )
);

-- Directors and admins can view all activities
CREATE POLICY "Directors can view all weekly activities"
ON public.broker_weekly_activities
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true
);

-- Directors and admins can manage all activities
CREATE POLICY "Directors can manage all weekly activities"
ON public.broker_weekly_activities
FOR ALL
USING (
  get_user_role(auth.uid()) = 'diretor' OR get_current_user_admin_status() = true
);

-- Create trigger for updated_at
CREATE TRIGGER update_broker_weekly_activities_updated_at
BEFORE UPDATE ON public.broker_weekly_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();