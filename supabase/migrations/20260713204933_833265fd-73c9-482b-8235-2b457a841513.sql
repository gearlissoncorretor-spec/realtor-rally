UPDATE public.profiles
SET allowed_screens = array_append(allowed_screens, 'gaming')
WHERE NOT ('gaming' = ANY(COALESCE(allowed_screens, ARRAY[]::text[])));