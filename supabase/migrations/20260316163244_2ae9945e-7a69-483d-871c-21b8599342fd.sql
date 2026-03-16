
-- 1. Make sale_id nullable so brokers can create commissions without a linked sale
ALTER TABLE public.commissions ALTER COLUMN sale_id DROP NOT NULL;

-- 2. Add description column for commission origin/description
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS description text;

-- 3. Add received_at column to track when broker marked as received
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS received_at timestamp with time zone;

-- 4. Allow brokers to INSERT their own commissions
CREATE POLICY "Brokers can create own commissions"
ON public.commissions FOR INSERT
TO authenticated
WITH CHECK (
  broker_id IN (
    SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()
  )
);

-- 5. Allow brokers to UPDATE their own commissions (to mark as received)
CREATE POLICY "Brokers can update own commissions"
ON public.commissions FOR UPDATE
TO authenticated
USING (
  broker_id IN (
    SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()
  )
)
WITH CHECK (
  broker_id IN (
    SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()
  )
);

-- 6. Allow brokers to DELETE their own commissions
CREATE POLICY "Brokers can delete own commissions"
ON public.commissions FOR DELETE
TO authenticated
USING (
  broker_id IN (
    SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()
  )
);
