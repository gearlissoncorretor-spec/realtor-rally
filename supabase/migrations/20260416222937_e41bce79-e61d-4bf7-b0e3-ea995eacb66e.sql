-- Allow anyone to view organization settings (branding only)
-- This is necessary to show the logo and name on the login page before authentication
CREATE POLICY "Public can view organization settings"
ON public.organization_settings
FOR SELECT
USING (true);
