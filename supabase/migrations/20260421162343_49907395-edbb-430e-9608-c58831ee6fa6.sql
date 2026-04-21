-- Create gastos_corretor table
CREATE TABLE public.gastos_corretor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL, -- Fixo, Variável, Pontual
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gastos_corretor ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expenses" 
ON public.gastos_corretor 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
ON public.gastos_corretor 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
ON public.gastos_corretor 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
ON public.gastos_corretor 
FOR DELETE 
USING (auth.uid() = user_id);

-- Directors and Managers can view all expenses in their company
CREATE POLICY "Managers can view company expenses" 
ON public.gastos_corretor 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'diretor' OR ur.role = 'gerente' OR ur.role = 'admin')
    AND p.company_id = gastos_corretor.company_id
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gastos_corretor_updated_at
BEFORE UPDATE ON public.gastos_corretor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
