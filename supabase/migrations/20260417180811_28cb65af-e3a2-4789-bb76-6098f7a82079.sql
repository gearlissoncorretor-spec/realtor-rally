-- Add unique constraint to user_id in brokers table if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'brokers_user_id_unique'
    ) THEN
        ALTER TABLE public.brokers ADD CONSTRAINT brokers_user_id_unique UNIQUE (user_id);
    END IF;
END $$;
