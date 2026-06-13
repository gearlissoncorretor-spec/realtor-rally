-- Tabela de itens de rotina (checklist diária do usuário)
CREATE TABLE public.routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid,
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time time,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  order_index integer NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine_items TO authenticated;
GRANT ALL ON public.routine_items TO service_role;

ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own routine items"
  ON public.routine_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_routine_items_user_date ON public.routine_items(user_id, scheduled_date);

CREATE TRIGGER trg_routine_items_updated_at
  BEFORE UPDATE ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_routine_items_set_company
  BEFORE INSERT ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();