
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, identifier, window_start)
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_rate_limits"
ON public.rate_limits FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (bucket, identifier, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON public.rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _identifier text,
  _max_requests integer,
  _window_minutes integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  v_window_start := date_trunc('minute', now())
    - (EXTRACT(minute FROM now())::int % _window_minutes) * interval '1 minute';

  INSERT INTO public.rate_limits (bucket, identifier, window_start, count)
  VALUES (_bucket, _identifier, v_window_start, 1)
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- opportunistic cleanup of old windows (older than 24h)
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';

  RETURN v_count <= _max_requests;
END;
$$;
