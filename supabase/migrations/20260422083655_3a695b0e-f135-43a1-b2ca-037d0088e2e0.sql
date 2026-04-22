ALTER TABLE public.curriculum_modules
  ADD COLUMN IF NOT EXISTS course_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS pedagogy TEXT,
  ADD COLUMN IF NOT EXISTS assessment_cie_marks INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS assessment_see_marks INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS exam_hours TEXT,
  ADD COLUMN IF NOT EXISTS references_list TEXT[];

ALTER TABLE public.curriculum_sections
  ADD COLUMN IF NOT EXISTS rbt_levels TEXT,
  ADD COLUMN IF NOT EXISTS co_mapping TEXT,
  ADD COLUMN IF NOT EXISTS hours_allocated INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS teaching_methodology TEXT;

CREATE TABLE IF NOT EXISTS public.course_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  co_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  rbt_levels TEXT,
  hours INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(curriculum_module_id, co_number)
);

ALTER TABLE public.course_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Course outcomes are viewable by everyone" ON public.course_outcomes;
DROP POLICY IF EXISTS "Authenticated users can view course outcomes" ON public.course_outcomes;
DROP POLICY IF EXISTS "Admins manage course outcomes" ON public.course_outcomes;
DROP POLICY IF EXISTS "Instructors view allocated course outcomes" ON public.course_outcomes;

CREATE POLICY "Course outcomes are viewable by everyone"
ON public.course_outcomes
FOR SELECT
USING (true);

CREATE POLICY "Admins manage course outcomes"
ON public.course_outcomes
FOR ALL
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Instructors view allocated course outcomes"
ON public.course_outcomes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.subject_allocations sa
    WHERE sa.curriculum_module_id = course_outcomes.curriculum_module_id
      AND sa.instructor_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  academic_semester TEXT,
  section TEXT,
  contact_hours_per_week INTEGER DEFAULT 3,
  total_periods INTEGER DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(curriculum_module_id, instructor_id, academic_semester)
);

ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lesson plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Instructors manage own lesson plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Instructors view own lesson plans" ON public.lesson_plans;

CREATE POLICY "Admins manage lesson plans"
ON public.lesson_plans
FOR ALL
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Instructors manage own lesson plans"
ON public.lesson_plans
FOR ALL
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.lesson_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  lecture_number INTEGER NOT NULL,
  module_number INTEGER,
  curriculum_section_id UUID REFERENCES public.curriculum_sections(id) ON DELETE SET NULL,
  topic_title TEXT,
  rbt_level TEXT,
  co_mapping TEXT,
  actual_date DATE,
  faculty_remarks TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_plan_id, lecture_number)
);

ALTER TABLE public.lesson_plan_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lesson plan entries" ON public.lesson_plan_entries;
DROP POLICY IF EXISTS "Instructors manage own lesson plan entries" ON public.lesson_plan_entries;

CREATE POLICY "Admins manage lesson plan entries"
ON public.lesson_plan_entries
FOR ALL
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Instructors manage own lesson plan entries"
ON public.lesson_plan_entries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp
    WHERE lp.id = lesson_plan_entries.lesson_plan_id
      AND lp.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_plans lp
    WHERE lp.id = lesson_plan_entries.lesson_plan_id
      AND lp.instructor_id = auth.uid()
  )
);

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS paper_code TEXT,
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS curriculum_module_id UUID,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'one_time';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'cultural';

CREATE INDEX IF NOT EXISTS idx_course_outcomes_module ON public.course_outcomes(curriculum_module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_instructor ON public.lesson_plans(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_module ON public.lesson_plans(curriculum_module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_entries_plan ON public.lesson_plan_entries(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_schedules_batch ON public.schedules(batch_id);
CREATE INDEX IF NOT EXISTS idx_schedules_curriculum_module ON public.schedules(curriculum_module_id);

DROP TRIGGER IF EXISTS update_course_outcomes_updated_at ON public.course_outcomes;
CREATE TRIGGER update_course_outcomes_updated_at
BEFORE UPDATE ON public.course_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_lesson_plans_updated_at ON public.lesson_plans;
CREATE TRIGGER update_lesson_plans_updated_at
BEFORE UPDATE ON public.lesson_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_lesson_plan_entries_updated_at ON public.lesson_plan_entries;
CREATE TRIGGER update_lesson_plan_entries_updated_at
BEFORE UPDATE ON public.lesson_plan_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();