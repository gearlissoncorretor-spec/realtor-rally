UPDATE public.profiles
SET allowed_screens = (
  SELECT array_agg(DISTINCT s) FROM unnest(allowed_screens || ARRAY['leads']) AS s
)
WHERE 'follow-up' = ANY(allowed_screens) AND NOT ('leads' = ANY(allowed_screens));