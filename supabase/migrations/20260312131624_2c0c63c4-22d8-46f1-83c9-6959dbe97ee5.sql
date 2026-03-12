
-- Create goal_types table for dynamic goal type management
CREATE TABLE public.goal_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  value_format text NOT NULL DEFAULT 'integer' CHECK (value_format IN ('currency', 'integer', 'percentage')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_types ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active goal types
CREATE POLICY "Users can view goal types"
  ON public.goal_types FOR SELECT
  TO authenticated
  USING (true);

-- Admins and directors can manage goal types
CREATE POLICY "Admins and directors can manage goal types"
  ON public.goal_types FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    get_user_role(auth.uid()) = 'diretor'
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    get_user_role(auth.uid()) = 'diretor'
  );

-- Company isolation
CREATE POLICY "company_isolation_goal_types"
  ON public.goal_types FOR ALL
  TO authenticated
  USING ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()))
  WITH CHECK ((company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Auto set company_id trigger
CREATE TRIGGER set_company_id_goal_types
  BEFORE INSERT ON public.goal_types
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_company_id();

-- Insert default system types
INSERT INTO public.goal_types (name, value_format, description, is_system, order_index) VALUES
  ('Número de Vendas', 'integer', 'Meta de quantidade de vendas', true, 1),
  ('VGV (Valor Geral de Vendas)', 'currency', 'Meta de valor geral de vendas', true, 2),
  ('VGC (Valor Geral de Comissão)', 'currency', 'Meta de valor geral de comissão', true, 3),
  ('Receita', 'currency', 'Meta de receita', true, 4),
  ('Comissão Individual', 'currency', 'Meta de comissão individual', true, 5),
  ('Número de Atendimentos', 'integer', 'Meta de atendimentos realizados', true, 6),
  ('Captação de Imóveis', 'integer', 'Meta de captação de imóveis', true, 7),
  ('Contratação de Corretores', 'integer', 'Meta de contratação', true, 8),
  ('Conversão', 'percentage', 'Meta de taxa de conversão', true, 9);
