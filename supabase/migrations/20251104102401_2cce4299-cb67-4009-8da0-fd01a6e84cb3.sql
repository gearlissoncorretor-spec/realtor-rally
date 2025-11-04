-- Drop the existing trigger first
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.profiles;

-- Recreate the function with service role bypass
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role to bypass all checks
  IF current_setting('role', true) = 'service_role' THEN
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

-- Recreate the trigger
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();