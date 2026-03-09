
-- Push subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Company isolation
CREATE POLICY "push_subs_company_isolation" ON public.push_subscriptions
FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()))
WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Auto set company_id
CREATE TRIGGER set_push_sub_company_id
BEFORE INSERT ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

-- Update updated_at
CREATE TRIGGER update_push_sub_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint to system_settings.key for VAPID key storage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_settings_key_unique'
  ) THEN
    ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_key_unique UNIQUE (key);
  END IF;
END $$;
