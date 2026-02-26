-- Create PDF storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-pdfs', 'course-pdfs', false);

-- RLS: Instructors can upload PDFs
CREATE POLICY "Instructors can upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-pdfs' AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  );

-- RLS: Enrolled students and instructors can read PDFs
CREATE POLICY "Authenticated users can read course PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-pdfs' AND auth.role() = 'authenticated'
  );

-- RLS: Instructors can delete their own uploads
CREATE POLICY "Instructors can delete own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-pdfs' AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  );

-- RLS: Instructors can update their own uploads
CREATE POLICY "Instructors can update own PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-pdfs' AND (
      public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin')
    )
  );
