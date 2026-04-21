-- Add origem column to follow_ups
ALTER TABLE public.follow_ups ADD COLUMN IF NOT EXISTS origem TEXT;

-- Map existing values in sales
UPDATE public.sales 
SET origem = CASE 
    WHEN UPPER(origem) LIKE '%MARKETPLACE%' OR UPPER(origem) LIKE '%MARTEPLACE%' THEN 'Marketplace'
    WHEN UPPER(origem) IN ('TRÁFEGO PAGO', 'FACEBOOK', 'PATROCINADO EQUIP') THEN 'Tráfego Pago (Patrocinado)'
    WHEN UPPER(origem) IN ('INDICAÇÃO', 'PARCEIRO', 'INDICAÇAO') THEN 'Indicação'
    WHEN UPPER(origem) IN ('CARTEIRA', 'CARTEIRA ', 'CARTEIRA PROPRIA', 'LISTA PESSOAL') THEN 'Lista Pessoal'
    WHEN UPPER(origem) = 'ANÚNCIO GERAL' THEN 'Anúncio Geral'
    WHEN UPPER(origem) = 'AÇÃO DE RUA' THEN 'Ação de Rua'
    WHEN UPPER(origem) = 'LISTA IMOBILIÁRIA' THEN 'Lista Imobiliária'
    WHEN UPPER(origem) = 'OUTRO' THEN 'Outro'
    ELSE 'Outro'
END;

-- Map existing values in negotiations (though mostly NULL)
UPDATE public.negotiations 
SET origem = CASE 
    WHEN UPPER(origem) LIKE '%MARKETPLACE%' OR UPPER(origem) LIKE '%MARTEPLACE%' THEN 'Marketplace'
    WHEN UPPER(origem) IN ('TRÁFEGO PAGO', 'FACEBOOK', 'PATROCINADO EQUIP') THEN 'Tráfego Pago (Patrocinado)'
    WHEN UPPER(origem) IN ('INDICAÇÃO', 'PARCEIRO', 'INDICAÇAO') THEN 'Indicação'
    WHEN UPPER(origem) IN ('CARTEIRA', 'CARTEIRA ', 'CARTEIRA PROPRIA', 'LISTA PESSOAL') THEN 'Lista Pessoal'
    WHEN UPPER(origem) = 'ANÚNCIO GERAL' THEN 'Anúncio Geral'
    WHEN UPPER(origem) = 'AÇÃO DE RUA' THEN 'Ação de Rua'
    WHEN UPPER(origem) = 'LISTA IMOBILIÁRIA' THEN 'Lista Imobiliária'
    WHEN UPPER(origem) = 'OUTRO' THEN 'Outro'
    ELSE 'Outro'
END;

-- Set default for follow_ups
UPDATE public.follow_ups SET origem = 'Outro' WHERE origem IS NULL;

-- Add check constraints
ALTER TABLE public.follow_ups ADD CONSTRAINT check_follow_up_origem CHECK (origem IN ('Marketplace', 'Tráfego Pago (Patrocinado)', 'Ação de Rua', 'Lista Imobiliária', 'Lista Pessoal', 'Anúncio Geral', 'Indicação', 'Outro'));
ALTER TABLE public.negotiations ADD CONSTRAINT check_negotiation_origem CHECK (origem IN ('Marketplace', 'Tráfego Pago (Patrocinado)', 'Ação de Rua', 'Lista Imobiliária', 'Lista Pessoal', 'Anúncio Geral', 'Indicação', 'Outro'));
ALTER TABLE public.sales ADD CONSTRAINT check_sales_origem CHECK (origem IN ('Marketplace', 'Tráfego Pago (Patrocinado)', 'Ação de Rua', 'Lista Imobiliária', 'Lista Pessoal', 'Anúncio Geral', 'Indicação', 'Outro'));

-- Make NOT NULL
ALTER TABLE public.follow_ups ALTER COLUMN origem SET NOT NULL;
ALTER TABLE public.negotiations ALTER COLUMN origem SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN origem SET NOT NULL;
