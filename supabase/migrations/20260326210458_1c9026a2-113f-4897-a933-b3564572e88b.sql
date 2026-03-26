-- Add 'tipo' column to sales table
ALTER TABLE public.sales ADD COLUMN tipo TEXT CHECK (tipo IN ('captacao', 'venda'));

-- Update existing records: if 'captador' is present, mark as 'captacao', otherwise 'venda'
UPDATE public.sales 
SET tipo = CASE 
    WHEN captador IS NOT NULL AND captador != '' THEN 'captacao' 
    ELSE 'venda' 
END;

-- Now make it mandatory for future records
-- Using a default value 'venda' to avoid issues with existing data if something was missed, 
-- but the requirement says "mandatory", so we'll set it as NOT NULL after update.
ALTER TABLE public.sales ALTER COLUMN tipo SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN tipo SET DEFAULT 'venda';
