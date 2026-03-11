
-- Link broker Gearlisson Silva to his profile (gerente)
UPDATE public.brokers 
SET user_id = '65dc8be4-4d97-48c8-bd89-ed32912e3bab'
WHERE id = '01287817-a991-4a49-ba21-e844a47e21e5' 
AND user_id IS NULL;
