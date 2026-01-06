-- ========================================
-- 1. TABELA: broker_activities (Atividades dos Corretores)
-- ========================================

CREATE TABLE public.broker_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- visita, ligação, follow-up, reunião, ação de rua
    client_name TEXT,
    property_reference TEXT,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    observations TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, realizada, cancelada
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_broker_activities_broker_id ON public.broker_activities(broker_id);
CREATE INDEX idx_broker_activities_status ON public.broker_activities(status);
CREATE INDEX idx_broker_activities_activity_date ON public.broker_activities(activity_date);

-- Enable RLS
ALTER TABLE public.broker_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies para broker_activities
-- Corretores veem apenas suas atividades
CREATE POLICY "Brokers can view their own activities"
ON public.broker_activities
FOR SELECT
USING (broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Corretores podem criar suas próprias atividades (quando permitido)
CREATE POLICY "Brokers can create their own activities"
ON public.broker_activities
FOR INSERT
WITH CHECK (
    broker_id IN (
        SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Corretores podem atualizar suas próprias atividades
CREATE POLICY "Brokers can update their own activities"
ON public.broker_activities
FOR UPDATE
USING (broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Gerentes veem atividades da sua equipe
CREATE POLICY "Managers can view team activities"
ON public.broker_activities
FOR SELECT
USING (
    get_user_role(auth.uid()) = 'gerente'
    AND broker_id IN (
        SELECT b.id FROM public.brokers b
        JOIN public.profiles p ON b.team_id = p.team_id
        WHERE p.id = auth.uid()
    )
);

-- Gerentes podem gerenciar atividades da sua equipe
CREATE POLICY "Managers can manage team activities"
ON public.broker_activities
FOR ALL
USING (
    get_user_role(auth.uid()) = 'gerente'
    AND broker_id IN (
        SELECT b.id FROM public.brokers b
        JOIN public.profiles p ON b.team_id = p.team_id
        WHERE p.id = auth.uid()
    )
);

-- Diretores e admins veem tudo
CREATE POLICY "Directors and admins can view all activities"
ON public.broker_activities
FOR SELECT
USING (
    get_user_role(auth.uid()) = 'diretor'
    OR get_current_user_admin_status() = true
);

-- Diretores e admins podem gerenciar tudo
CREATE POLICY "Directors and admins can manage all activities"
ON public.broker_activities
FOR ALL
USING (
    get_user_role(auth.uid()) = 'diretor'
    OR get_current_user_admin_status() = true
);

-- Trigger para updated_at
CREATE TRIGGER update_broker_activities_updated_at
BEFORE UPDATE ON public.broker_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 2. TABELA: negotiations (Negociações)
-- ========================================

CREATE TABLE public.negotiations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    property_address TEXT NOT NULL,
    property_type TEXT NOT NULL DEFAULT 'apartamento',
    negotiated_value NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'em_contato', -- em_contato, proposta_enviada, em_analise, aprovado, cancelado, venda_concluida
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    observations TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_negotiations_broker_id ON public.negotiations(broker_id);
CREATE INDEX idx_negotiations_status ON public.negotiations(status);
CREATE INDEX idx_negotiations_start_date ON public.negotiations(start_date);

-- Enable RLS
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para negotiations
-- Corretores veem apenas suas negociações
CREATE POLICY "Brokers can view their own negotiations"
ON public.negotiations
FOR SELECT
USING (broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Corretores podem criar suas próprias negociações
CREATE POLICY "Brokers can create their own negotiations"
ON public.negotiations
FOR INSERT
WITH CHECK (
    broker_id IN (
        SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
);

-- Corretores podem atualizar suas próprias negociações
CREATE POLICY "Brokers can update their own negotiations"
ON public.negotiations
FOR UPDATE
USING (broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Gerentes veem negociações da sua equipe
CREATE POLICY "Managers can view team negotiations"
ON public.negotiations
FOR SELECT
USING (
    get_user_role(auth.uid()) = 'gerente'
    AND broker_id IN (
        SELECT b.id FROM public.brokers b
        JOIN public.profiles p ON b.team_id = p.team_id
        WHERE p.id = auth.uid()
    )
);

-- Gerentes podem gerenciar negociações da sua equipe
CREATE POLICY "Managers can manage team negotiations"
ON public.negotiations
FOR ALL
USING (
    get_user_role(auth.uid()) = 'gerente'
    AND broker_id IN (
        SELECT b.id FROM public.brokers b
        JOIN public.profiles p ON b.team_id = p.team_id
        WHERE p.id = auth.uid()
    )
);

-- Diretores e admins veem tudo
CREATE POLICY "Directors and admins can view all negotiations"
ON public.negotiations
FOR SELECT
USING (
    get_user_role(auth.uid()) = 'diretor'
    OR get_current_user_admin_status() = true
);

-- Diretores e admins podem gerenciar tudo
CREATE POLICY "Directors and admins can manage all negotiations"
ON public.negotiations
FOR ALL
USING (
    get_user_role(auth.uid()) = 'diretor'
    OR get_current_user_admin_status() = true
);

-- Trigger para updated_at
CREATE TRIGGER update_negotiations_updated_at
BEFORE UPDATE ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();