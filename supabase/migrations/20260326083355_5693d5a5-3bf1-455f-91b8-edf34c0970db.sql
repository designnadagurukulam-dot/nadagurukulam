
-- Add instructor_id and pdf_url to assignments table
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS instructor_id uuid;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  file_url text,
  text_content text,
  status text NOT NULL DEFAULT 'submitted',
  grade text,
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS for assignment_submissions
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own submissions" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view submissions for their assignments" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id
      AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all submissions" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can update submissions for their assignments" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON c.id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Add instructor INSERT/UPDATE/DELETE policies on assignments
CREATE POLICY "Instructors can insert own assignments" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can update own assignments" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can delete own assignments" ON public.assignments
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'instructor') AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can view own assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor') AND 
    EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = assignments.course_id AND c.instructor_id = auth.uid()
    )
  );

-- Create storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload assignment files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-files');

CREATE POLICY "Authenticated users can view assignment files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-files');

-- Trigger for updated_at
CREATE TRIGGER update_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
