
-- ============================================
-- Facebook Lead Ads Integration (per-user OAuth)
-- ============================================

-- 1) facebook_connections: one row per user OAuth grant
CREATE TABLE public.facebook_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  agency_id UUID,
  facebook_user_id TEXT NOT NULL,
  facebook_user_name TEXT,
  facebook_user_email TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active', -- active | expired | revoked
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, facebook_user_id)
);

CREATE INDEX idx_fb_connections_user ON public.facebook_connections(user_id);
CREATE INDEX idx_fb_connections_company ON public.facebook_connections(company_id);

ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own FB connections"
  ON public.facebook_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view company FB connections"
  ON public.facebook_connections FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE TRIGGER trg_fb_connections_company
  BEFORE INSERT ON public.facebook_connections
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER trg_fb_connections_agency
  BEFORE INSERT ON public.facebook_connections
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_agency_id();

CREATE TRIGGER trg_fb_connections_updated
  BEFORE UPDATE ON public.facebook_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) facebook_pages: pages the user selected to receive leads from
CREATE TABLE public.facebook_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.facebook_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  agency_id UUID,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  category TEXT,
  picture_url TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  last_lead_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_id)
);

CREATE INDEX idx_fb_pages_user ON public.facebook_pages(user_id);
CREATE INDEX idx_fb_pages_page ON public.facebook_pages(page_id);
CREATE INDEX idx_fb_pages_connection ON public.facebook_pages(connection_id);

ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own FB pages"
  ON public.facebook_pages FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view company FB pages"
  ON public.facebook_pages FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE TRIGGER trg_fb_pages_company
  BEFORE INSERT ON public.facebook_pages
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER trg_fb_pages_agency
  BEFORE INSERT ON public.facebook_pages
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_agency_id();

CREATE TRIGGER trg_fb_pages_updated
  BEFORE UPDATE ON public.facebook_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) facebook_lead_forms: lead forms catalogued per page
CREATE TABLE public.facebook_lead_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  agency_id UUID,
  form_id TEXT NOT NULL,
  form_name TEXT,
  status TEXT,
  leads_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, form_id)
);

CREATE INDEX idx_fb_forms_page ON public.facebook_lead_forms(page_id);
CREATE INDEX idx_fb_forms_form ON public.facebook_lead_forms(form_id);

ALTER TABLE public.facebook_lead_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own FB lead forms"
  ON public.facebook_lead_forms FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view company FB lead forms"
  ON public.facebook_lead_forms FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'super_admin'))
  );

CREATE TRIGGER trg_fb_forms_company
  BEFORE INSERT ON public.facebook_lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER trg_fb_forms_agency
  BEFORE INSERT ON public.facebook_lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_agency_id();

CREATE TRIGGER trg_fb_forms_updated
  BEFORE UPDATE ON public.facebook_lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) facebook_oauth_states: short-lived CSRF state during OAuth handshake
CREATE TABLE public.facebook_oauth_states (
  state TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes')
);

CREATE INDEX idx_fb_oauth_states_user ON public.facebook_oauth_states(user_id);

ALTER TABLE public.facebook_oauth_states ENABLE ROW LEVEL SECURITY;

-- No client policies: only edge functions (service role) touch this table
