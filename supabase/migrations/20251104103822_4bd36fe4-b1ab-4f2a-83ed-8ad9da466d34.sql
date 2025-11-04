-- Drop and recreate the prevent_privilege_escalation function with better logic
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow initial profile setup (INSERT or first approval)
  IF TG_OP = 'INSERT' OR OLD.approved IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent non-admins from changing approval or allowed screens
  IF NOT get_current_user_admin_status() AND (
    (OLD.approved IS DISTINCT FROM NEW.approved) OR
    (OLD.allowed_screens IS DISTINCT FROM NEW.allowed_screens)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify approval or allowed screens';
  END IF;
  
  -- Prevent users from changing other users' profiles  
  IF auth.uid() != NEW.id AND NOT get_current_user_admin_status() THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add RLS policies for service role operations
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
CREATE POLICY "Service role can update profiles"
ON public.profiles FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert user_roles" ON public.user_roles;
CREATE POLICY "Service role can insert user_roles"
ON public.user_roles FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert brokers" ON public.brokers;
CREATE POLICY "Service role can insert brokers"
ON public.brokers FOR INSERT
TO service_role
WITH CHECK (true);