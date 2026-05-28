
-- 1. Coupons: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (is_active = true OR public.is_super_or_admin(auth.uid()));

-- 2. user_roles: drop the wide-open lookup policy; restrict authenticated reads
--    to non-privileged roles (instructor, admin) so the staff chat list still
--    works without exposing super_admin assignments.
DROP POLICY IF EXISTS "Authenticated users can read roles for staff lookup" ON public.user_roles;
CREATE POLICY "Authenticated users can view staff roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (role IN ('instructor'::app_role, 'admin'::app_role));

-- 3. Storage: assignment-files SELECT — restrict to the file owner (path
--    segment 2 matches auth.uid()) or instructors/admins reviewing work.
DROP POLICY IF EXISTS "Authenticated users can view assignment files" ON storage.objects;
CREATE POLICY "Owners and staff can view assignment files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-files'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_super_or_admin(auth.uid())
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- 4. Storage: assignment-files INSERT — require user's id in the path
DROP POLICY IF EXISTS "Authenticated users can upload assignment files" ON storage.objects;
CREATE POLICY "Users can upload assignment files to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[1] IN ('assignments', 'submissions')
);

-- 5. Storage: curriculum-materials INSERT/UPDATE — restrict to instructors/admins
DROP POLICY IF EXISTS "Auth users upload curriculum materials" ON storage.objects;
CREATE POLICY "Instructors and admins upload curriculum materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'curriculum-materials'
  AND (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'::app_role))
);

DROP POLICY IF EXISTS "Auth users update curriculum materials" ON storage.objects;
CREATE POLICY "Instructors and admins update curriculum materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'curriculum-materials'
  AND (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'::app_role))
);

-- 6. SECURITY DEFINER functions: revoke EXECUTE from anon and public.
--    Trigger-only functions also revoke from authenticated.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_super_or_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_last_super_admin_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_enrollment_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_feedback_rating() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, public;

-- 7. Enable leaked-password protection (HIBP)
-- (handled via configure_auth, not SQL)
