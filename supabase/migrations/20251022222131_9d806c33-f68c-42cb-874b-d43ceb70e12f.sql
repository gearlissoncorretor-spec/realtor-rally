-- Phase 1: Create secure user roles system
-- Step 1: Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'diretor', 'gerente', 'corretor', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Step 3: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 5: Create helper function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text
      WHEN 'admin' THEN 1
      WHEN 'diretor' THEN 2
      WHEN 'gerente' THEN 3
      WHEN 'corretor' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;

-- Step 6: Migrate existing data from profiles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  id,
  CASE 
    WHEN is_admin = true THEN 'admin'::app_role
    WHEN role = 'diretor' THEN 'diretor'::app_role
    WHEN role = 'gerente' THEN 'gerente'::app_role
    WHEN role = 'corretor' THEN 'corretor'::app_role
    ELSE 'user'::app_role
  END,
  created_at
FROM profiles
WHERE id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 7: Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Step 8: Update existing get_user_role function to use new table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_primary_role(user_id)
$$;

-- Step 9: Update get_current_user_admin_status to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;

-- Step 10: Create audit log table for tracking important actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _table_name TEXT,
  _record_id UUID DEFAULT NULL,
  _old_data JSONB DEFAULT NULL,
  _new_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data);
END;
$$;

-- Step 11: Add indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Step 12: Add performance indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_sales_broker_id ON public.sales(broker_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_brokers_team_id ON public.brokers(team_id);
CREATE INDEX IF NOT EXISTS idx_goals_assigned_to ON public.goals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_goals_broker_id ON public.goals(broker_id);
CREATE INDEX IF NOT EXISTS idx_goals_team_id ON public.goals(team_id);

COMMENT ON TABLE public.user_roles IS 'Secure role management table - prevents privilege escalation';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for security and compliance';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles without RLS recursion';