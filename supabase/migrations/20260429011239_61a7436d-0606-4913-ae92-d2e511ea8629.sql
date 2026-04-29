-- 1. Move data from unlinked duplicate to linked one (Lorrany case)
DO $$
DECLARE
    unlinked_id UUID := '4c1599a2-7339-4be9-a466-41fc1c97c40b';
    linked_id UUID := 'ece17d27-24f4-4da3-b81a-9d3c3135bccf';
BEGIN
    -- Only if both exist
    IF EXISTS (SELECT 1 FROM public.brokers WHERE id = unlinked_id) AND EXISTS (SELECT 1 FROM public.brokers WHERE id = linked_id) THEN
        UPDATE public.sales SET broker_id = linked_id WHERE broker_id = unlinked_id;
        UPDATE public.follow_ups SET broker_id = linked_id WHERE broker_id = unlinked_id;
        UPDATE public.negotiations SET broker_id = linked_id WHERE broker_id = unlinked_id;
        UPDATE public.broker_weekly_activities SET broker_id = linked_id WHERE broker_id = unlinked_id;
        DELETE FROM public.brokers WHERE id = unlinked_id;
    END IF;
END $$;

-- 2. Link remaining brokers by email if user_id is null
-- Using a subquery to avoid unique constraint violations if there were any other duplicates we missed
UPDATE public.brokers b
SET user_id = p.id
FROM public.profiles p
WHERE b.user_id IS NULL 
AND LOWER(b.email) = LOWER(p.email)
AND NOT EXISTS (
    SELECT 1 FROM public.brokers b2 
    WHERE b2.user_id = p.id
);

-- 3. Create a function to automatically link broker to user_id on profile or broker changes
CREATE OR REPLACE FUNCTION public.sync_broker_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    UPDATE public.brokers
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;
  ELSIF TG_TABLE_NAME = 'brokers' THEN
    IF NEW.user_id IS NULL THEN
      SELECT id INTO NEW.user_id
      FROM public.profiles
      WHERE LOWER(email) = LOWER(NEW.email);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add triggers
DROP TRIGGER IF EXISTS trigger_sync_broker_user_id ON public.brokers;
CREATE TRIGGER trigger_sync_broker_user_id
BEFORE INSERT OR UPDATE OF email ON public.brokers
FOR EACH ROW
EXECUTE FUNCTION public.sync_broker_user_id();

DROP TRIGGER IF EXISTS trigger_sync_profile_to_broker ON public.profiles;
CREATE TRIGGER trigger_sync_profile_to_broker
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_broker_user_id();
