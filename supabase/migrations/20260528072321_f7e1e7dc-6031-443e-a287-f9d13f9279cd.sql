
-- 1. Profiles INSERT policy
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_or_admin(auth.uid()));

-- 2. Coupons: lock down SELECT to admins, expose validator function
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

CREATE POLICY "Admins can view coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (public.is_super_or_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text)
RETURNS TABLE (
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  valid_until timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.discount_type, c.discount_value, c.valid_until
  FROM public.coupons c
  WHERE c.code = _code
    AND c.is_active = true
    AND (c.valid_until IS NULL OR c.valid_until > now())
    AND c.valid_from <= now()
    AND (c.max_uses IS NULL OR c.used_count < c.max_uses)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO authenticated;

-- 3. assignment-files bucket: DELETE/UPDATE policies
CREATE POLICY "Owners can delete own assignment files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-files'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Owners can update own assignment files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-files'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Admins can delete assignment files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assignment-files' AND public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update assignment files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assignment-files' AND public.is_super_or_admin(auth.uid()));

-- 4. course-pdfs bucket: add ownership check (files stored under {uid}/...)
DROP POLICY IF EXISTS "Instructors can delete own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update own PDFs" ON storage.objects;

CREATE POLICY "Instructors can delete own PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'course-pdfs'
    AND public.has_role(auth.uid(), 'instructor'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Instructors can update own PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'course-pdfs'
    AND public.has_role(auth.uid(), 'instructor'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete course PDFs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-pdfs' AND public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update course PDFs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-pdfs' AND public.is_super_or_admin(auth.uid()));

-- 5. kyc-documents bucket: UPDATE/DELETE
CREATE POLICY "Owners can update own KYC docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners can delete own KYC docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can delete KYC docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update KYC docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.is_super_or_admin(auth.uid()));

-- 6. student-certificates: replace admin SELECT with is_super_or_admin
DROP POLICY IF EXISTS "Admins can view all certificates" ON storage.objects;

CREATE POLICY "Admins can view all certificate files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-certificates' AND public.is_super_or_admin(auth.uid()));

-- 7. student-projects: UPDATE/DELETE
CREATE POLICY "Students can delete own project files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Students can update own project files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-projects'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete project files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-projects' AND public.is_super_or_admin(auth.uid()));

CREATE POLICY "Admins can update project files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-projects' AND public.is_super_or_admin(auth.uid()));
