SELECT vault.create_secret('https://kwsnnwiwflsvsqiuzfja.supabase.co', 'SUPABASE_URL', 'Project URL for notify_broadcast');
SELECT vault.create_secret('3b6f89fa9b4613dd2e283f1cd46ab5a66c3d2283b64ff14d', 'CRON_SECRET', 'Internal secret for notify_broadcast');

CREATE OR REPLACE FUNCTION public.trg_notify_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_users uuid[];
BEGIN
  SELECT COALESCE(array_agg(DISTINCT uid), ARRAY[]::uuid[]) INTO v_users FROM (
    SELECT NEW.user_id AS uid WHERE NEW.user_id IS NOT NULL
    UNION
    SELECT p.id FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.company_id = NEW.company_id AND ur.role::text IN ('diretor','gerente','admin')
  ) x WHERE uid IS NOT NULL;
  PERFORM public.notify_broadcast(v_users,
    '🆕 Novo lead',
    format('%s%s%s',
      COALESCE(NEW.name,'Sem nome'),
      CASE WHEN NEW.phone IS NOT NULL THEN ' • ' || NEW.phone ELSE '' END,
      CASE WHEN NEW.source IS NOT NULL THEN ' • ' || NEW.source ELSE '' END),
    '/leads','lead_created','info', NEW.company_id,
    jsonb_build_object('lead_id', NEW.id, 'phone', NEW.phone, 'name', NEW.name));
  RETURN NEW;
END $$;