-- Add teams table for hierarchical organization
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add team management fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN team_id UUID REFERENCES public.teams(id),
ADD COLUMN manager_id UUID REFERENCES public.profiles(id);

-- Update role enum to include new hierarchy levels
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE TEXT;

-- Update default allowed screens for new roles
ALTER TABLE public.profiles 
ALTER COLUMN allowed_screens SET DEFAULT ARRAY['dashboard'::text];

-- Add team_id to brokers table for team association
ALTER TABLE public.brokers 
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table
CREATE POLICY "Directors can manage all teams" 
ON public.teams 
FOR ALL 
USING (get_user_role(auth.uid()) = 'diretor');

CREATE POLICY "Managers can view their team" 
ON public.teams 
FOR SELECT 
USING (
  id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()) OR
  get_user_role(auth.uid()) = 'diretor'
);

CREATE POLICY "All authenticated users can view teams" 
ON public.teams 
FOR SELECT 
TO authenticated 
USING (true);

-- Update handle_new_user function to set appropriate defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  default_role TEXT;
  default_screens TEXT[];
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Set default role and screens based on user type
  IF user_count = 0 THEN
    default_role := 'diretor';
    default_screens := ARRAY['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes'];
  ELSE
    default_role := 'corretor';
    default_screens := ARRAY['dashboard', 'vendas'];
  END IF;
  
  INSERT INTO public.profiles (id, full_name, email, is_admin, role, allowed_screens, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE WHEN user_count = 0 THEN true ELSE false END,
    default_role,
    default_screens,
    CASE WHEN user_count = 0 THEN true ELSE false END -- First user is auto-approved
  );
  
  RETURN NEW;
END;
$$;

-- Add trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get team hierarchy data
CREATE OR REPLACE FUNCTION public.get_team_hierarchy(user_id UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  is_manager BOOLEAN,
  team_members UUID[]
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_team AS (
    SELECT t.id, t.name, p.role, p.manager_id
    FROM public.profiles p
    LEFT JOIN public.teams t ON p.team_id = t.id
    WHERE p.id = user_id
  )
  SELECT 
    ut.id,
    ut.name,
    (ut.role = 'gerente'),
    CASE 
      WHEN ut.role = 'diretor' THEN 
        ARRAY(SELECT id FROM public.profiles WHERE team_id IS NOT NULL)
      WHEN ut.role = 'gerente' THEN 
        ARRAY(SELECT id FROM public.profiles WHERE team_id = ut.id)
      ELSE 
        ARRAY[user_id]
    END
  FROM user_team ut;
$$;