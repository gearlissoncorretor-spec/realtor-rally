CREATE OR REPLACE FUNCTION public.sync_user_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
BEGIN
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = NEW.id
  ORDER BY
    CASE role::text
      WHEN 'super_admin' THEN 0
      WHEN 'socio' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'diretor' THEN 3
      WHEN 'gerente' THEN 4
      WHEN 'corretor' THEN 5
      ELSE 6
    END
  LIMIT 1;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'company_id', NEW.company_id,
      'agency_id', NEW.agency_id,
      'primary_role', v_role
    )
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear o UPDATE de profiles por causa do sync de metadata
  RAISE WARNING 'sync_user_metadata falhou: %', SQLERRM;
  RETURN NEW;
END;
$function$;