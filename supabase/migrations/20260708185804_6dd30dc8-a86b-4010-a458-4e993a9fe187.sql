
CREATE OR REPLACE FUNCTION public.notify_broadcast(
  _user_ids uuid[], _title text, _body text, _url text, _type text,
  _severity text DEFAULT 'info', _company_id uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_url text; v_secret text;
BEGIN
  IF _user_ids IS NULL OR array_length(_user_ids, 1) IS NULL THEN RETURN; END IF;
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN; END IF;
  PERFORM extensions.http((
    'POST', v_url || '/functions/v1/push-notifications?action=broadcast',
    ARRAY[extensions.http_header('Content-Type','application/json'), extensions.http_header('x-cron-secret', v_secret)],
    'application/json',
    jsonb_build_object('user_ids', to_jsonb(_user_ids),'title',_title,'body',_body,'url',_url,'type',_type,'severity',_severity,'company_id',_company_id,'metadata',_metadata)::text
  )::extensions.http_request);
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'notify_broadcast failed: %', SQLERRM;
END $$;

-- SALES
CREATE OR REPLACE FUNCTION public.trg_notify_new_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_users uuid[]; v_broker_user uuid;
BEGIN
  SELECT user_id INTO v_broker_user FROM public.brokers WHERE id = NEW.broker_id;
  SELECT COALESCE(array_agg(DISTINCT p.id), ARRAY[]::uuid[]) INTO v_users
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE p.company_id = NEW.company_id
    AND ur.role::text IN ('admin','socio','diretor','gerente')
    AND p.id <> COALESCE(v_broker_user, '00000000-0000-0000-0000-000000000000'::uuid);
  PERFORM public.notify_broadcast(v_users,
    '🎉 Nova venda registrada',
    format('Cliente %s • VGV R$ %s', COALESCE(NEW.client_name,'—'), to_char(COALESCE(NEW.vgv,0),'FM999G999G990D00')),
    '/vendas','sale_created','success', NEW.company_id, jsonb_build_object('sale_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_sale ON public.sales;
CREATE TRIGGER notify_new_sale AFTER INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_sale();

-- LEADS
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
    format('%s%s', COALESCE(NEW.name,'Sem nome'), CASE WHEN NEW.source IS NOT NULL THEN ' • ' || NEW.source ELSE '' END),
    '/leads','lead_created','info', NEW.company_id, jsonb_build_object('lead_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_lead ON public.leads;
CREATE TRIGGER notify_new_lead AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_lead();

-- NEGOTIATIONS
CREATE OR REPLACE FUNCTION public.trg_notify_new_negotiation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.brokers WHERE id = NEW.broker_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notify_broadcast(ARRAY[v_user],
    '💼 Nova negociação',
    format('%s%s', COALESCE(NEW.client_name,'Sem cliente'), CASE WHEN NEW.negotiated_value IS NOT NULL THEN ' • R$ ' || to_char(NEW.negotiated_value,'FM999G999G990D00') ELSE '' END),
    '/negociacoes','negotiation_created','info', NEW.company_id, jsonb_build_object('negotiation_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_negotiation ON public.negotiations;
CREATE TRIGGER notify_new_negotiation AFTER INSERT ON public.negotiations FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_negotiation();

-- BROKER TASKS (assignee = brokers.user_id)
CREATE OR REPLACE FUNCTION public.trg_notify_new_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.brokers WHERE id = NEW.broker_id;
  IF v_user IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notify_broadcast(ARRAY[v_user],
    '📋 Nova tarefa',
    COALESCE(NEW.title, 'Você tem uma nova tarefa'),
    '/atividades','task_assigned','info', NEW.company_id,
    jsonb_build_object('task_id', NEW.id, 'due_date', NEW.due_date));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_new_task ON public.broker_tasks;
CREATE TRIGGER notify_new_task AFTER INSERT ON public.broker_tasks FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_task();

-- CRON: daily briefing 08:00 São Paulo (11:00 UTC)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-briefing') THEN
    PERFORM cron.unschedule('daily-briefing');
  END IF;
END $$;

SELECT cron.schedule('daily-briefing','0 11 * * *', $$
  SELECT extensions.http((
    'POST',
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/push-notifications?action=daily-briefing',
    ARRAY[extensions.http_header('Content-Type','application/json'),
          extensions.http_header('x-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'))],
    'application/json','{}'
  )::extensions.http_request);
$$);
