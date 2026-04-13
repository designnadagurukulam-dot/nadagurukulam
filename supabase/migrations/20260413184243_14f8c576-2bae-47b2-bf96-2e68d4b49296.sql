
-- ============================================
-- Phase 2: Database Schema Additions
-- ============================================

-- 2A. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_document_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_document_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_document_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;

-- 2B. Create batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  batch_code TEXT UNIQUE,
  course_id UUID REFERENCES public.courses(id),
  start_date DATE,
  end_date DATE,
  instructor_id UUID,
  max_students INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage batches" ON public.batches
  FOR ALL USING (is_super_or_admin(auth.uid()));

CREATE POLICY "Instructors view own batches" ON public.batches
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Students view batches" ON public.batches
  FOR SELECT USING (has_role(auth.uid(), 'student'));

-- 2C. Create batch_enrollments table
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID,
  UNIQUE(batch_id, student_id)
);
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student sees own batch enrollment" ON public.batch_enrollments
  FOR SELECT USING (student_id = auth.uid() OR is_super_or_admin(auth.uid()));

CREATE POLICY "Admin manages batch enrollments" ON public.batch_enrollments
  FOR ALL USING (is_super_or_admin(auth.uid()));

CREATE POLICY "Instructor manages own batch enrollments" ON public.batch_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.batches WHERE id = batch_id AND instructor_id = auth.uid())
  );

-- 2D. Add batch_id to curriculum_modules
ALTER TABLE public.curriculum_modules ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id);

-- 2E. Add audio_url, pdf_url to curriculum_sections
ALTER TABLE public.curriculum_sections ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.curriculum_sections ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2F. Create live_classes table
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL,
  batch_id UUID REFERENCES public.batches(id),
  course_id UUID REFERENCES public.courses(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT NOT NULL,
  meeting_platform TEXT DEFAULT 'zoom',
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage live classes" ON public.live_classes
  FOR ALL USING (is_super_or_admin(auth.uid()));

CREATE POLICY "Instructor manages own live classes" ON public.live_classes
  FOR ALL USING (instructor_id = auth.uid());

CREATE POLICY "Students view live classes for their batch" ON public.live_classes
  FOR SELECT USING (
    batch_id IN (SELECT batch_id FROM public.batch_enrollments WHERE student_id = auth.uid())
  );

-- 2G. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users mark messages as read" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid());

CREATE POLICY "Admins view all messages" ON public.messages
  FOR SELECT USING (is_super_or_admin(auth.uid()));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2H. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  instructor_id UUID,
  batch_id UUID REFERENCES public.batches(id),
  rating INTEGER,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_anonymous BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Add validation trigger for rating
CREATE OR REPLACE FUNCTION public.validate_feedback_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_feedback_rating_trigger
  BEFORE INSERT OR UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_feedback_rating();

CREATE POLICY "Admins view all feedback" ON public.feedback
  FOR SELECT USING (is_super_or_admin(auth.uid()));

CREATE POLICY "Students submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- 2I. Add columns to assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS external_link TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('curriculum-materials', 'curriculum-materials', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies: curriculum-materials (public read, auth upload)
CREATE POLICY "Public read curriculum materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'curriculum-materials');

CREATE POLICY "Auth users upload curriculum materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'curriculum-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users update curriculum materials" ON storage.objects
  FOR UPDATE USING (bucket_id = 'curriculum-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Admins delete curriculum materials" ON storage.objects
  FOR DELETE USING (bucket_id = 'curriculum-materials' AND is_super_or_admin(auth.uid()));

-- Storage policies: kyc-documents (private - user uploads own, admins read all)
CREATE POLICY "Users upload own KYC docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own KYC docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_super_or_admin(auth.uid())));

-- Storage policies: profile-avatars (public read, user uploads own)
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
