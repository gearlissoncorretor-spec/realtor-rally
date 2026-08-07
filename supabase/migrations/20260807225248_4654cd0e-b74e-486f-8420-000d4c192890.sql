CREATE OR REPLACE FUNCTION public.notify_broadcast(
  _user_ids uuid[], _title text, _body text, _url text, _type text,
  _severity text DEFAULT 'info', _company_id uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_url text; v_secret text;
BEGIN
  IF _user_ids IS NULL OR array_length(_user_ids, 1) IS NULL THEN RETURN; END IF;
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET';
  IF v_url IS NULL OR v_secret IS NULL THEN RAISE WARNING 'notify_broadcast: missing vault secrets'; RETURN; END IF;
  PERFORM net.http_post(
    url := v_url || '/functions/v1/push-notifications?action=broadcast',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
    body := jsonb_build_object('user_ids', to_jsonb(_user_ids),'title',_title,'body',_body,'url',_url,'type',_type,'severity',_severity,'company_id',_company_id,'metadata',_metadata)
  );
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'notify_broadcast failed: %', SQLERRM;
END $$;