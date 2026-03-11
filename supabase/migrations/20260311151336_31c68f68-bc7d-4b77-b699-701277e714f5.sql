
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS due_date date DEFAULT NULL;

COMMENT ON COLUMN public.commissions.due_date IS 'Data prevista para recebimento da comissão';
