
-- 1) curriculum_topics table
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curriculum topics"
  ON public.curriculum_topics FOR SELECT TO public USING (true);

CREATE POLICY "Admins and instructors manage topics insert"
  ON public.curriculum_topics FOR INSERT TO authenticated
  WITH CHECK (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Admins and instructors manage topics update"
  ON public.curriculum_topics FOR UPDATE TO authenticated
  USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Admins and instructors manage topics delete"
  ON public.curriculum_topics FOR DELETE TO authenticated
  USING (public.is_super_or_admin(auth.uid()) OR public.has_role(auth.uid(), 'instructor'));

CREATE TRIGGER trg_curriculum_topics_updated_at
  BEFORE UPDATE ON public.curriculum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_curriculum_topics_module ON public.curriculum_topics(module_id, sort_order);

-- 2) Add topic_id to curriculum_sections (nullable for backward compat)
ALTER TABLE public.curriculum_sections
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.curriculum_topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_sections_topic ON public.curriculum_sections(topic_id);

-- 3) Backfill: create a default "General" topic per module that has sections, link them
DO $$
DECLARE
  m RECORD;
  new_topic_id uuid;
BEGIN
  FOR m IN
    SELECT DISTINCT cs.module_id
    FROM public.curriculum_sections cs
    WHERE cs.topic_id IS NULL
  LOOP
    INSERT INTO public.curriculum_topics (module_id, title, sort_order)
    VALUES (m.module_id, 'General', 0)
    RETURNING id INTO new_topic_id;

    UPDATE public.curriculum_sections
    SET topic_id = new_topic_id
    WHERE module_id = m.module_id AND topic_id IS NULL;
  END LOOP;
END $$;

-- 4) student_grades table
CREATE TABLE IF NOT EXISTS public.student_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  curriculum_module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  cie_marks numeric,
  see_marks numeric,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, batch_id, curriculum_module_id)
);

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage student grades"
  ON public.student_grades FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid()))
  WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Students view own grades"
  ON public.student_grades FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors view grades for own batches"
  ON public.student_grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.id = student_grades.batch_id AND b.instructor_id = auth.uid()
    )
  );

CREATE TRIGGER trg_student_grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_grades_batch ON public.student_grades(batch_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON public.student_grades(student_id);

-- 5) admin_label column on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_label text;

-- 6) Case-insensitive unique index on courses.title to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_courses_title_ci ON public.courses (lower(title));
