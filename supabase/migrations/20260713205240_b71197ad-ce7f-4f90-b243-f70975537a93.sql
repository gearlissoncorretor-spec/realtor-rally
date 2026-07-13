DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(trim(name)) BETWEEN 2 AND 120
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 200
  AND message IS NOT NULL AND length(trim(message)) BETWEEN 5 AND 2000
  AND (phone IS NULL OR length(phone) <= 40)
);