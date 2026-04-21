-- Add agency_id to process_stages first
ALTER TABLE public.process_stages ADD COLUMN agency_id UUID REFERENCES public.agencies(id);

-- Add process_stage_id to negotiations
ALTER TABLE public.negotiations ADD COLUMN process_stage_id UUID REFERENCES public.process_stages(id);

-- Insert missing stages from negotiation_statuses into process_stages
DO $$
DECLARE
    stage_id UUID;
    company_id_val UUID;
    agency_id_val UUID;
BEGIN
    -- Get default company and agency
    SELECT company_id, agency_id INTO company_id_val, agency_id_val FROM public.negotiations WHERE company_id IS NOT NULL LIMIT 1;
    
    -- If no negotiations exist, try sales
    IF company_id_val IS NULL THEN
        SELECT company_id, agency_id INTO company_id_val, agency_id_val FROM public.sales WHERE company_id IS NOT NULL LIMIT 1;
    END IF;

    -- "Em Contato"
    SELECT id INTO stage_id FROM public.process_stages WHERE title = 'Em Contato' AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Em Contato', '#3b82f6', -5, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'em_contato';

    -- "Em Aprovação"
    SELECT id INTO stage_id FROM public.process_stages WHERE title IN ('Aguardando Aprovação', 'Em Aprovação') AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Em Aprovação', '#f97316', -4, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'em_aprovacao';

    -- "Cliente Reprovado"
    SELECT id INTO stage_id FROM public.process_stages WHERE title = 'Cliente Reprovado' AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Cliente Reprovado', '#ef4444', -3, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'cliente_reprovado';

    -- "Cliente Aprovado"
    SELECT id INTO stage_id FROM public.process_stages WHERE title IN ('Aprovado', 'Cliente Aprovado') AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Cliente Aprovado', '#22c55e', -2, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'cliente_aprovado';

    -- "Contrato"
    SELECT id INTO stage_id FROM public.process_stages WHERE title = 'Contrato' AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Contrato', '#a855f7', -1, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'contrato';

    -- "Perdida"
    SELECT id INTO stage_id FROM public.process_stages WHERE title = 'Perdida' AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Perdida', '#6b7280', 100, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'perdida';

    -- "Venda Concluída"
    SELECT id INTO stage_id FROM public.process_stages WHERE title IN ('Finalizado', 'Venda Concluída') AND (company_id = company_id_val OR company_id IS NULL) LIMIT 1;
    IF stage_id IS NULL THEN
        INSERT INTO public.process_stages (title, color, order_index, is_default, company_id, agency_id)
        VALUES ('Venda Concluída', '#10b981', 101, true, company_id_val, agency_id_val) RETURNING id INTO stage_id;
    END IF;
    UPDATE public.negotiations SET process_stage_id = stage_id WHERE status = 'venda_concluida';
END $$;
