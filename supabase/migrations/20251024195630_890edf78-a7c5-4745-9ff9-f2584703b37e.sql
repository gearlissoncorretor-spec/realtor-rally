-- Tabela para configurações de branding/identidade visual da organização
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL DEFAULT 'Gestão Senador Canedo',
  organization_tagline TEXT DEFAULT 'Sistema Premium de Gestão Imobiliária',
  logo_url TEXT,
  logo_icon_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar configurações"
  ON public.organization_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem atualizar configurações"
  ON public.organization_settings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem inserir configurações"
  ON public.organization_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO public.organization_settings (organization_name, organization_tagline)
VALUES ('Gestão Senador Canedo', 'Sistema Premium de Gestão Imobiliária')
ON CONFLICT DO NOTHING;