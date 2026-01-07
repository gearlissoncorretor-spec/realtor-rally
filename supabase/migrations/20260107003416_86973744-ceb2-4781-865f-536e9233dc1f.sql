-- Fix the trigger to allow service role operations (when auth.uid() is null)
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is an INSERT or if approved was previously NULL, allow it
  IF TG_OP = 'INSERT' OR OLD.approved IS NULL THEN
    RETURN NEW;
  END IF;

  -- If auth.uid() is NULL, this is a service role operation - allow it
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user is trying to modify sensitive fields without admin role
  IF NOT has_role(auth.uid(), 'admin') AND (
    (OLD.approved IS DISTINCT FROM NEW.approved) OR
    (OLD.allowed_screens IS DISTINCT FROM NEW.allowed_screens)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify approval or allowed screens';
  END IF;
  
  -- Check if user is trying to modify another user's profile without admin role
  IF auth.uid() != NEW.id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;
  
  RETURN NEW;
END;
$$;