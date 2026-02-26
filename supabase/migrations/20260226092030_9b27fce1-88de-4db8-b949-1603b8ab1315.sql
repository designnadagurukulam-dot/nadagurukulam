-- Course Modules table
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published course modules" ON public.course_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND (courses.status = 'approved' OR courses.instructor_id = auth.uid()))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can insert own course modules" ON public.course_modules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can update own course modules" ON public.course_modules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can delete own course modules" ON public.course_modules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.instructor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Add updated_at trigger
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
