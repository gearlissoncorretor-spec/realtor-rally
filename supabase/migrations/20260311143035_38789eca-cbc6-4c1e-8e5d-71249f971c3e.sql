-- Add 'negociacoes' to allowed_screens for gerentes who don't have it
UPDATE profiles
SET allowed_screens = array_append(allowed_screens, 'negociacoes')
WHERE id IN (
  SELECT p.id FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'gerente'
  AND NOT ('negociacoes' = ANY(COALESCE(p.allowed_screens, ARRAY[]::text[])))
);
