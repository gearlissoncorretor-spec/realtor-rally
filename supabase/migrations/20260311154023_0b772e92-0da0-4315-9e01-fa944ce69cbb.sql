
-- Add 'agenda', 'comissoes', 'gestao-usuarios' to all gerentes who don't have them yet
UPDATE public.profiles
SET allowed_screens = array_cat(
  COALESCE(allowed_screens, ARRAY[]::text[]),
  ARRAY['agenda', 'comissoes', 'gestao-usuarios']
)
WHERE id IN (
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'gerente'
)
AND (
  NOT ('agenda' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
  OR NOT ('comissoes' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
  OR NOT ('gestao-usuarios' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
);

-- Also add to diretores and admins
UPDATE public.profiles
SET allowed_screens = array_cat(
  COALESCE(allowed_screens, ARRAY[]::text[]),
  ARRAY['agenda', 'comissoes', 'gestao-usuarios']
)
WHERE id IN (
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'diretor')
)
AND (
  NOT ('agenda' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
  OR NOT ('comissoes' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
  OR NOT ('gestao-usuarios' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
);

-- Add agenda and comissoes to corretores too
UPDATE public.profiles
SET allowed_screens = array_cat(
  COALESCE(allowed_screens, ARRAY[]::text[]),
  ARRAY['agenda', 'comissoes']
)
WHERE id IN (
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'corretor'
)
AND (
  NOT ('agenda' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
  OR NOT ('comissoes' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])))
);
