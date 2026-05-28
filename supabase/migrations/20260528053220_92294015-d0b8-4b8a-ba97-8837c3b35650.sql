
-- Add program_id, semester, and manual active toggle to batches
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS is_manually_active boolean NOT NULL DEFAULT true;

-- Add program_id and richer course academic fields to curriculum_modules
ALTER TABLE public.curriculum_modules
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS instructor_id uuid,
  ADD COLUMN IF NOT EXISTS credits integer,
  ADD COLUMN IF NOT EXISTS teaching_hours integer,
  ADD COLUMN IF NOT EXISTS periods integer,
  ADD COLUMN IF NOT EXISTS exam_type text,
  ADD COLUMN IF NOT EXISTS cie_exam_hours text,
  ADD COLUMN IF NOT EXISTS see_exam_hours text;

-- Total semesters per program (stored on categories used as programs)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS total_semesters integer NOT NULL DEFAULT 8;

-- Backfill batches.program_id from linked course's program_id
UPDATE public.batches b
  SET program_id = c.program_id
  FROM public.courses c
  WHERE b.course_id = c.id
    AND b.program_id IS NULL
    AND c.program_id IS NOT NULL;
