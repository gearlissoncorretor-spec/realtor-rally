-- Remove public (unauthenticated) read access to the private 'avatars' and 'media' buckets.
-- Authenticated read access remains via auth_view_avatars / auth_view_media.
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;