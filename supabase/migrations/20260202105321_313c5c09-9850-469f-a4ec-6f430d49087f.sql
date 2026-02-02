-- Create follow_up_statuses table for customizable statuses
CREATE TABLE public.follow_up_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default follow up statuses
INSERT INTO public.follow_up_statuses (value, label, color, icon, order_index, is_system) VALUES
  ('novo_lead', 'Novo Lead', 'bg-blue-500/10 text-blue-500 border-blue-500/20', '🆕', 0, true),
  ('primeiro_contato', 'Primeiro Contato', 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', '📞', 1, true),
  ('aguardando_retorno', 'Aguardando Retorno', 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', '⏳', 2, true),
  ('cliente_frio', 'Cliente Frio', 'bg-slate-500/10 text-slate-500 border-slate-500/20', '❄️', 3, true),
  ('cliente_quente', 'Cliente Quente', 'bg-orange-500/10 text-orange-500 border-orange-500/20', '🔥', 4, true),
  ('agendado_atendimento', 'Agendado Atendimento', 'bg-green-500/10 text-green-500 border-green-500/20', '📅', 5, true);

-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  property_interest TEXT,
  estimated_vgv NUMERIC NOT NULL DEFAULT 0,
  next_contact_date DATE,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'novo_lead',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_up_contacts table for contact history
CREATE TABLE public.follow_up_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follow_up_id UUID NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'whatsapp',
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.follow_up_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for follow_up_statuses (everyone can read, admins can modify)
CREATE POLICY "Anyone can view follow up statuses"
ON public.follow_up_statuses
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage follow up statuses"
ON public.follow_up_statuses
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'diretor'));

-- RLS policies for follow_ups
CREATE POLICY "Users can view follow_ups based on role"
ON public.follow_ups
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'diretor') OR
  (public.has_role(auth.uid(), 'gerente') AND broker_id IN (
    SELECT b.id FROM public.brokers b 
    WHERE b.team_id IN (
      SELECT p.team_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )) OR
  (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can insert follow_ups"
ON public.follow_ups
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'diretor') OR
  public.has_role(auth.uid(), 'gerente') OR
  (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can update follow_ups based on role"
ON public.follow_ups
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'diretor') OR
  (public.has_role(auth.uid(), 'gerente') AND broker_id IN (
    SELECT b.id FROM public.brokers b 
    WHERE b.team_id IN (
      SELECT p.team_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )) OR
  (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can delete follow_ups based on role"
ON public.follow_ups
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'diretor') OR
  (public.has_role(auth.uid(), 'gerente') AND broker_id IN (
    SELECT b.id FROM public.brokers b 
    WHERE b.team_id IN (
      SELECT p.team_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  )) OR
  (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
);

-- RLS policies for follow_up_contacts
CREATE POLICY "Users can view contacts based on follow_up access"
ON public.follow_up_contacts
FOR SELECT
USING (
  follow_up_id IN (SELECT id FROM public.follow_ups)
);

CREATE POLICY "Users can insert contacts for accessible follow_ups"
ON public.follow_up_contacts
FOR INSERT
WITH CHECK (
  follow_up_id IN (SELECT id FROM public.follow_ups)
);

CREATE POLICY "Users can delete contacts for accessible follow_ups"
ON public.follow_up_contacts
FOR DELETE
USING (
  follow_up_id IN (SELECT id FROM public.follow_ups)
);

-- Create indexes for performance
CREATE INDEX idx_follow_ups_broker_id ON public.follow_ups(broker_id);
CREATE INDEX idx_follow_ups_status ON public.follow_ups(status);
CREATE INDEX idx_follow_ups_next_contact_date ON public.follow_ups(next_contact_date);
CREATE INDEX idx_follow_up_contacts_follow_up_id ON public.follow_up_contacts(follow_up_id);

-- Trigger for updated_at
CREATE TRIGGER update_follow_ups_updated_at
BEFORE UPDATE ON public.follow_ups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_up_statuses_updated_at
BEFORE UPDATE ON public.follow_up_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();