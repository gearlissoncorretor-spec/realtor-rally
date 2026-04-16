-- Update allowed_screens for all users with the 'corretor' role
-- We'll add the default screens for corretores to their current allowed_screens if they are missing
UPDATE public.profiles
SET allowed_screens = ARRAY(
  SELECT DISTINCT unnest(array_cat(allowed_screens, ARRAY['follow-up', 'negociacoes', 'metas', 'atividades', 'comissoes', 'agenda', 'instalar']))
)
WHERE id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'corretor'
);

-- Also ensure that any existing broker row is present for these users?
-- That's harder as we need a team_id, but we can at least check.
