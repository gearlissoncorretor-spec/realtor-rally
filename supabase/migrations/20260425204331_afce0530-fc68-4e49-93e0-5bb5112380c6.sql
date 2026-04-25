-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  
  source TEXT NOT NULL DEFAULT 'manual', -- facebook | site | manual | instagram | whatsapp
  campaign TEXT,
  adset TEXT,
  ad TEXT,
  
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  
  status TEXT NOT NULL DEFAULT 'novo', -- novo | atendimento | convertido | perdido
  
  notes TEXT,
  raw_payload JSONB, -- payload completo do webhook para debug
  
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_company_id ON public.leads(company_id);
CREATE INDEX idx_leads_agency_id ON public.leads(agency_id);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user can view a lead
CREATE OR REPLACE FUNCTION public.can_view_lead(_lead_company_id uuid, _lead_agency_id uuid, _lead_user_id uuid, _viewer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Same company always required
    _lead_company_id = get_user_company_id(_viewer_id)
    AND (
      -- Admin/Socio/Super: full company access
      has_role(_viewer_id, 'admin')
      OR has_role(_viewer_id, 'socio')
      OR has_role(_viewer_id, 'super_admin')
      -- Diretor: agency access
      OR (has_role(_viewer_id, 'diretor') AND (_lead_agency_id = get_user_agency_id(_viewer_id) OR _lead_agency_id IS NULL))
      -- Gerente: team access (same agency)
      OR (has_role(_viewer_id, 'gerente') AND (_lead_agency_id = get_user_agency_id(_viewer_id) OR _lead_agency_id IS NULL))
      -- Corretor: only own leads
      OR (has_role(_viewer_id, 'corretor') AND _lead_user_id = _viewer_id)
    )
$$;

-- RLS Policies
CREATE POLICY "Users can view leads based on role"
ON public.leads FOR SELECT
TO authenticated
USING (public.can_view_lead(company_id, agency_id, user_id, auth.uid()));

CREATE POLICY "Authenticated users can insert leads in their company"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Service role can insert leads (webhook)"
ON public.leads FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Managers and above can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'socio')
    OR has_role(auth.uid(), 'diretor')
    OR has_role(auth.uid(), 'gerente')
    OR (has_role(auth.uid(), 'corretor') AND user_id = auth.uid())
  )
);

CREATE POLICY "Admins and managers can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'socio')
    OR has_role(auth.uid(), 'diretor')
    OR has_role(auth.uid(), 'gerente')
  )
);

-- Trigger: auto-set company_id and agency_id
CREATE TRIGGER leads_set_company_agency
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_company_and_agency_ids();

-- Trigger: updated_at
CREATE TRIGGER leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();