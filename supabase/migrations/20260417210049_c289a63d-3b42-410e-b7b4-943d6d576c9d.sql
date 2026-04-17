-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can insert a contact submission
CREATE POLICY "Anyone can submit contact form" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Only super admins can manage contact submissions
CREATE POLICY "Super admins can manage contact submissions" 
ON public.contact_submissions 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add default system settings for contact form
-- Use '"true"' because it's jsonb and we want a json boolean/string
INSERT INTO public.system_settings (key, value, description)
VALUES 
('contact_form_enabled', 'true', 'Habilita ou desabilita o formulário de contato na landing page'),
('contact_form_email_recipient', '"suporte@gestaomaster.com"', 'E-mail que receberá as notificações de novo contato')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
