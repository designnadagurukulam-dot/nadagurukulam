-- Course Lessons table
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_type text NOT NULL DEFAULT 'video',
  video_url text,
  pdf_url text,
  content_text text,
  duration_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View lessons for enrolled or preview" ON public.course_lessons
  FOR SELECT USING (
    course_lessons.is_preview = true
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.enrollments e ON e.course_id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can insert own lessons" ON public.course_lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can update own lessons" ON public.course_lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can delete own lessons" ON public.course_lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
