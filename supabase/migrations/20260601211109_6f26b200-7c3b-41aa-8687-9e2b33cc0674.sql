CREATE OR REPLACE FUNCTION public.convert_negotiation_to_sale(
  p_negotiation_id uuid,
  p_sale_data jsonb,
  p_completed_stage_id uuid DEFAULT NULL
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_neg public.negotiations%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_role text;
  v_company_id uuid;
  v_agency_id uuid;
  v_sale_date date;
  v_contract_date date;
  v_property_type public.property_type;
  v_status public.sale_status;
  v_origin text;
  v_sale_type text;
  v_vgv numeric;
  v_vgc numeric;
  v_property_value numeric;
  v_notes text;
  v_can_convert boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT * INTO v_neg
  FROM public.negotiations
  WHERE id = p_negotiation_id
    AND status NOT IN ('venda_concluida', 'perdida')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Negociação não encontrada ou já finalizada';
  END IF;

  v_role := public.get_user_role(auth.uid());
  v_company_id := public.get_user_company_id(auth.uid());
  v_agency_id := public.get_user_agency_id(auth.uid());

  IF NOT (v_neg.company_id = v_company_id OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Você não tem acesso a esta negociação';
  END IF;

  IF NOT (
    v_neg.agency_id IS NULL
    OR v_neg.agency_id = v_agency_id
    OR v_role IN ('socio', 'admin')
    OR public.is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Você não tem acesso à agência desta negociação';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.brokers b
    WHERE b.id = v_neg.broker_id
      AND b.user_id = auth.uid()
  ) OR v_role IN ('gerente', 'diretor', 'admin', 'socio')
    OR public.is_super_admin(auth.uid())
  INTO v_can_convert;

  IF NOT v_can_convert THEN
    RAISE EXCEPTION 'Você não tem permissão para converter esta negociação';
  END IF;

  v_origin := COALESCE(NULLIF(TRIM(p_sale_data->>'origem'), ''), v_neg.origem, 'Outro');
  IF v_origin NOT IN ('Marketplace', 'Tráfego Pago (Patrocinado)', 'Ação de Rua', 'Lista Imobiliária', 'Lista Pessoal', 'Anúncio Geral', 'Indicação', 'Outro') THEN
    v_origin := 'Outro';
  END IF;

  v_sale_type := COALESCE(NULLIF(p_sale_data->>'sale_type', ''), 'lancamento');
  IF v_sale_type NOT IN ('lancamento', 'revenda') THEN
    v_sale_type := 'lancamento';
  END IF;

  v_property_type := CASE
    WHEN v_neg.property_type IN ('apartamento', 'casa', 'terreno', 'comercial', 'rural')
      THEN v_neg.property_type::public.property_type
    ELSE 'apartamento'::public.property_type
  END;

  v_status := COALESCE(NULLIF(p_sale_data->>'status', ''), 'confirmada')::public.sale_status;
  v_sale_date := COALESCE(NULLIF(p_sale_data->>'sale_date', '')::date, CURRENT_DATE);
  v_contract_date := NULLIF(p_sale_data->>'contract_date', '')::date;
  v_vgv := GREATEST(COALESCE(NULLIF(p_sale_data->>'vgv', '')::numeric, v_neg.negotiated_value, 0), 0);
  v_vgc := GREATEST(COALESCE(NULLIF(p_sale_data->>'vgc', '')::numeric, v_vgv, 0), 0);
  v_property_value := GREATEST(COALESCE(NULLIF(p_sale_data->>'property_value', '')::numeric, v_vgv, v_neg.negotiated_value, 0), 0);
  v_notes := TRIM(CONCAT_WS(' ', 'Venda originada da negociação.', NULLIF(p_sale_data->>'notes', ''), v_neg.observations));

  INSERT INTO public.sales (
    tipo,
    broker_id,
    client_name,
    client_email,
    client_phone,
    property_address,
    property_type,
    property_value,
    vgv,
    vgc,
    commission_value,
    sale_date,
    contract_date,
    status,
    notes,
    vendedor,
    vendedor_nome,
    captador,
    gerente,
    origem,
    sale_type,
    estilo,
    produto,
    pagos,
    ano,
    mes,
    latitude,
    longitude,
    visibilidade,
    company_id,
    agency_id
  ) VALUES (
    'venda',
    v_neg.broker_id,
    v_neg.client_name,
    v_neg.client_email,
    v_neg.client_phone,
    v_neg.property_address,
    v_property_type,
    v_property_value,
    v_vgv,
    v_vgc,
    NULLIF(p_sale_data->>'commission_value', '')::numeric,
    v_sale_date,
    v_contract_date,
    v_status,
    v_notes,
    NULLIF(p_sale_data->>'vendedor', ''),
    NULLIF(p_sale_data->>'vendedor_nome', ''),
    CASE WHEN v_sale_type = 'revenda' THEN NULLIF(p_sale_data->>'captador', '') ELSE NULL END,
    NULLIF(p_sale_data->>'gerente', ''),
    v_origin,
    v_sale_type,
    NULLIF(p_sale_data->>'estilo', ''),
    NULLIF(p_sale_data->>'produto', ''),
    COALESCE(NULLIF(p_sale_data->>'pagos', '')::numeric, 0),
    COALESCE(NULLIF(p_sale_data->>'ano', '')::integer, EXTRACT(YEAR FROM v_sale_date)::integer),
    COALESCE(NULLIF(p_sale_data->>'mes', '')::integer, EXTRACT(MONTH FROM v_sale_date)::integer),
    NULLIF(p_sale_data->>'latitude', ''),
    NULLIF(p_sale_data->>'longitude', ''),
    'venda',
    COALESCE(v_neg.company_id, v_company_id),
    COALESCE(v_neg.agency_id, v_agency_id)
  )
  RETURNING * INTO v_sale;

  UPDATE public.negotiations
  SET status = 'venda_concluida',
      process_stage_id = p_completed_stage_id,
      updated_at = now()
  WHERE id = v_neg.id;

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_negotiation_to_sale(uuid, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_negotiation_to_sale(uuid, jsonb, uuid) TO service_role;