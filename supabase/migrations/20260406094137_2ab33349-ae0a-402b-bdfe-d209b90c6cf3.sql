
-- Phase 1: Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS roll_number text,
  ADD COLUMN IF NOT EXISTS course_name text,
  ADD COLUMN IF NOT EXISTS year_of_commencement integer;

-- Add instructor_id to schedules
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS instructor_id uuid;

-- Allow instructors to view their own schedules
CREATE POLICY "Instructors can view own schedules"
  ON public.schedules FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

-- Phase 3: class_logs table
CREATE TABLE public.class_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE SET NULL,
  instructor_id uuid NOT NULL,
  topic_covered text NOT NULL,
  curriculum_section_id uuid REFERENCES public.curriculum_sections(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  status text NOT NULL DEFAULT 'pending_confirmation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can insert own class logs"
  ON public.class_logs FOR INSERT TO authenticated
  WITH CHECK (instructor_id = auth.uid() AND has_role(auth.uid(), 'instructor'));

CREATE POLICY "Instructors can view own class logs"
  ON public.class_logs FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can update own class logs"
  ON public.class_logs FOR UPDATE TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage class logs"
  ON public.class_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view class logs for their enrolled courses"
  ON public.class_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schedules s
      JOIN public.enrollments e ON e.course_id = s.course_id
      WHERE s.id = class_logs.schedule_id AND e.user_id = auth.uid()
    )
  );

-- class_log_confirmations table
CREATE TABLE public.class_log_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_log_id uuid NOT NULL REFERENCES public.class_logs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_log_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own confirmations"
  ON public.class_log_confirmations FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own confirmations"
  ON public.class_log_confirmations FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can view own confirmations"
  ON public.class_log_confirmations FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view confirmations for their logs"
  ON public.class_log_confirmations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_logs cl
      WHERE cl.id = class_log_confirmations.class_log_id AND cl.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage class log confirmations"
  ON public.class_log_confirmations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- student_projects table
CREATE TABLE public.student_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  subject text,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own projects"
  ON public.student_projects FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own projects"
  ON public.student_projects FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own projects"
  ON public.student_projects FOR UPDATE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can delete own projects"
  ON public.student_projects FOR DELETE TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins and instructors can view all projects"
  ON public.student_projects FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructor'));

-- subject_allocations table
CREATE TABLE public.subject_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid NOT NULL,
  curriculum_module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  semester integer NOT NULL,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subject_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view allocations"
  ON public.subject_allocations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage allocations"
  ON public.subject_allocations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Storage bucket for student certificate uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('student-certificates', 'student-certificates', false);

CREATE POLICY "Students can upload own certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can view own certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-certificates' AND has_role(auth.uid(), 'admin'));

-- Storage bucket for student project files
INSERT INTO storage.buckets (id, name, public) VALUES ('student-projects', 'student-projects', false);

CREATE POLICY "Students can upload own project files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-projects' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can view own project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-projects' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins and instructors can view all project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-projects' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructor')));
