
-- 1) Allow diretor/socio to bypass privilege-escalation guard when approving signups
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.approved IS NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'socio')
    OR has_role(auth.uid(), 'diretor')
    OR is_super_admin(auth.uid())
  ) AND (
    (OLD.approved IS DISTINCT FROM NEW.approved) OR
    (OLD.allowed_screens IS DISTINCT FROM NEW.allowed_screens)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to modify approval or allowed screens';
  END IF;

  IF auth.uid() != NEW.id AND NOT (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'socio')
    OR has_role(auth.uid(), 'diretor')
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Cannot modify other users profiles';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Extend view/approve policies to include diretor
DROP POLICY IF EXISTS "Admin and socio can view pending signups" ON public.profiles;
CREATE POLICY "Approvers can view pending signups" ON public.profiles
FOR SELECT
USING (
  approved = false AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'socio')
    OR has_role(auth.uid(), 'diretor')
    OR is_super_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admin and socio can approve pending signups" ON public.profiles;
CREATE POLICY "Approvers can approve pending signups" ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'socio')
  OR has_role(auth.uid(), 'diretor')
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'socio')
  OR has_role(auth.uid(), 'diretor')
  OR is_super_admin(auth.uid())
);
