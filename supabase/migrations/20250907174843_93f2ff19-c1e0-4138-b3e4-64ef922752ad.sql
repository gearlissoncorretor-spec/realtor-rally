-- Criar tipos enum para o sistema
CREATE TYPE public.broker_status AS ENUM ('ativo', 'inativo', 'ferias');
CREATE TYPE public.sale_status AS ENUM ('pendente', 'confirmada', 'cancelada');
CREATE TYPE public.property_type AS ENUM ('apartamento', 'casa', 'terreno', 'comercial', 'rural');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de corretores
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  cpf TEXT UNIQUE,
  creci TEXT UNIQUE,
  status public.broker_status DEFAULT 'ativo',
  hire_date DATE DEFAULT CURRENT_DATE,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  meta_monthly DECIMAL(12,2) DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  property_type public.property_type NOT NULL,
  property_address TEXT NOT NULL,
  property_value DECIMAL(12,2) NOT NULL,
  vgv DECIMAL(12,2) NOT NULL, -- Valor Geral de Vendas
  vgc DECIMAL(12,2) NOT NULL, -- Valor Geral Contratado
  commission_value DECIMAL(12,2),
  sale_date DATE DEFAULT CURRENT_DATE,
  contract_date DATE,
  status public.sale_status DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE public.targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_sales_count INTEGER DEFAULT 0,
  achieved_value DECIMAL(12,2) DEFAULT 0,
  achieved_sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broker_id, year, month)
);

-- Tabela de configurações do sistema
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para brokers (todos podem ver, apenas admins podem modificar)
CREATE POLICY "Everyone can view brokers" ON public.brokers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert brokers" ON public.brokers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update brokers" ON public.brokers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete brokers" ON public.brokers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para sales
CREATE POLICY "Everyone can view sales" ON public.sales
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sales" ON public.sales
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sales" ON public.sales
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para targets
CREATE POLICY "Everyone can view targets" ON public.targets
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage targets" ON public.targets
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para system_settings
CREATE POLICY "Everyone can view settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brokers_updated_at
    BEFORE UPDATE ON public.brokers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_targets_updated_at
    BEFORE UPDATE ON public.targets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados de exemplo
INSERT INTO public.system_settings (key, value, description) VALUES
('company_name', '"CRM Imobiliário"', 'Nome da empresa'),
('currency', '"BRL"', 'Moeda utilizada'),
('commission_default_rate', '5.0', 'Taxa de comissão padrão (%)');

-- Inserir corretores de exemplo (sem user_id por enquanto)
INSERT INTO public.brokers (name, email, phone, creci, status, commission_rate, meta_monthly) VALUES
('Ana Silva', 'ana.silva@empresa.com', '(11) 99999-1111', 'CRECI-12345', 'ativo', 5.00, 100000.00),
('Carlos Santos', 'carlos.santos@empresa.com', '(11) 99999-2222', 'CRECI-12346', 'ativo', 5.50, 120000.00),
('Maria Oliveira', 'maria.oliveira@empresa.com', '(11) 99999-3333', 'CRECI-12347', 'ativo', 4.50, 90000.00),
('João Costa', 'joao.costa@empresa.com', '(11) 99999-4444', 'CRECI-12348', 'ativo', 5.00, 80000.00),
('Paula Lima', 'paula.lima@empresa.com', '(11) 99999-5555', 'CRECI-12349', 'ativo', 6.00, 150000.00);

-- Inserir vendas de exemplo
INSERT INTO public.sales (broker_id, client_name, client_email, property_type, property_address, property_value, vgv, vgc, status, sale_date) VALUES
((SELECT id FROM public.brokers WHERE name = 'Ana Silva'), 'Cliente 1', 'cliente1@email.com', 'apartamento', 'Rua das Flores, 123', 350000.00, 350000.00, 320000.00, 'confirmada', '2024-01-15'),
((SELECT id FROM public.brokers WHERE name = 'Ana Silva'), 'Cliente 2', 'cliente2@email.com', 'casa', 'Av. Principal, 456', 500000.00, 500000.00, 450000.00, 'confirmada', '2024-02-10'),
((SELECT id FROM public.brokers WHERE name = 'Carlos Santos'), 'Cliente 3', 'cliente3@email.com', 'apartamento', 'Rua Central, 789', 280000.00, 280000.00, 250000.00, 'confirmada', '2024-01-20'),
((SELECT id FROM public.brokers WHERE name = 'Maria Oliveira'), 'Cliente 4', 'cliente4@email.com', 'terreno', 'Estrada Rural, 321', 150000.00, 150000.00, 140000.00, 'confirmada', '2024-02-05'),
((SELECT id FROM public.brokers WHERE name = 'João Costa'), 'Cliente 5', 'cliente5@email.com', 'comercial', 'Centro Comercial, Loja 12', 800000.00, 800000.00, 750000.00, 'pendente', '2024-02-20');

-- Inserir metas para 2024
INSERT INTO public.targets (broker_id, year, month, target_value, target_sales_count)
SELECT id, 2024, month_num, meta_monthly, 5
FROM public.brokers,
     generate_series(1, 12) AS month_num
WHERE status = 'ativo';

-- Atualizar valores realizados nas metas baseado nas vendas
UPDATE public.targets 
SET achieved_value = COALESCE(sales_data.total_value, 0),
    achieved_sales_count = COALESCE(sales_data.sales_count, 0)
FROM (
    SELECT 
        s.broker_id,
        EXTRACT(YEAR FROM s.sale_date) as year,
        EXTRACT(MONTH FROM s.sale_date) as month,
        SUM(s.vgc) as total_value,
        COUNT(*) as sales_count
    FROM public.sales s
    WHERE s.status = 'confirmada'
    GROUP BY s.broker_id, EXTRACT(YEAR FROM s.sale_date), EXTRACT(MONTH FROM s.sale_date)
) as sales_data
WHERE targets.broker_id = sales_data.broker_id 
  AND targets.year = sales_data.year 
  AND targets.month = sales_data.month;