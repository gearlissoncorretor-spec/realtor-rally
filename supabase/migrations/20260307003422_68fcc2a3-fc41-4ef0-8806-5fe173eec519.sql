
-- Add media columns to broker_notes for image and audio attachments
ALTER TABLE public.broker_notes 
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS audio_url text;

-- Allow managers and directors to also create/manage notes (not just admins)
CREATE POLICY "Directors can manage notes"
ON public.broker_notes FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'diretor')
WITH CHECK (get_user_role(auth.uid()) = 'diretor');

CREATE POLICY "Managers can manage team notes"
ON public.broker_notes FOR ALL
TO authenticated
USING (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'gerente' 
  AND broker_id IN (
    SELECT b.id FROM brokers b WHERE b.team_id = get_user_team_id(auth.uid())
  )
);
