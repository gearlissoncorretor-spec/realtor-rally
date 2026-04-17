-- 1. Add company_isolation to sticky_notes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sticky_notes' AND policyname = 'company_isolation') THEN
        ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY company_isolation ON public.sticky_notes 
        AS RESTRICTIVE 
        FOR ALL 
        TO authenticated 
        USING (company_id = get_user_company_id(auth.uid()))
        WITH CHECK (company_id = get_user_company_id(auth.uid()));
    END IF;
END $$;

-- 2. Tighten goal_progress insert policy
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS gp_insert ON public.goal_progress;

-- Create a more secure one that checks user identity
CREATE POLICY gp_insert ON public.goal_progress 
FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = created_by 
    OR 
    is_super_admin(auth.uid()) 
    OR 
    (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'diretor', 'gerente', 'socio']))
);

-- 3. Remove redundant service_role policies (to reduce noise and prevent accidental misconfiguration)
DROP POLICY IF EXISTS "Service role can insert brokers" ON public.brokers;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;

-- 4. Fix potential JWT expiration logic in auth-email-hook if it existed (checking current functions)
-- (No changes needed to Edge Functions for this, but noted for future logs)

-- 5. Storage security: Prevent listing on public buckets while allowing read
-- Note: In Supabase, if a bucket is 'public', 'SELECT' on storage.objects is often used for reading.
-- To prevent listing but allow reading, we can't easily do it with RLS if the bucket is public 'true'.
-- The best way is to keep buckets public but restrict the 'SELECT' policy if listing is not needed.
-- For avatars, listing is usually not needed.

DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars'); -- Listing still possible if public=true, but policy is at least explicit.
