-- Create process_stages table for custom pipeline stages
CREATE TABLE public.process_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.process_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for process_stages
CREATE POLICY "Everyone can view process stages" 
ON public.process_stages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage process stages" 
ON public.process_stages 
FOR ALL 
USING (get_current_user_admin_status() = true)
WITH CHECK (get_current_user_admin_status() = true);

-- Add process_stage_id to sales table
ALTER TABLE public.sales 
ADD COLUMN process_stage_id UUID REFERENCES public.process_stages(id);

-- Create trigger for automatic timestamp updates on process_stages
CREATE TRIGGER update_process_stages_updated_at
BEFORE UPDATE ON public.process_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default process stages
INSERT INTO public.process_stages (title, color, order_index, is_default) VALUES
  ('Prospecção', '#ef4444', 0, true),
  ('Qualificação', '#f97316', 1, true),
  ('Proposta', '#eab308', 2, true),
  ('Negociação', '#3b82f6', 3, true),
  ('Fechamento', '#22c55e', 4, true);

-- Update existing sales to use the first default stage
UPDATE public.sales 
SET process_stage_id = (
  SELECT id FROM public.process_stages 
  WHERE is_default = true 
  ORDER BY order_index ASC 
  LIMIT 1
)
WHERE process_stage_id IS NULL;

-- Enable realtime for process_stages
ALTER TABLE public.process_stages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.process_stages;

-- Enable realtime for sales (if not already enabled)
ALTER TABLE public.sales REPLICA IDENTITY FULL;