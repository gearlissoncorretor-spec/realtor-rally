-- Add loss_reason column to negotiations table
ALTER TABLE public.negotiations 
ADD COLUMN loss_reason text;

-- Add comment for documentation
COMMENT ON COLUMN public.negotiations.loss_reason IS 'Motivo da perda da negociação quando status = perdida';