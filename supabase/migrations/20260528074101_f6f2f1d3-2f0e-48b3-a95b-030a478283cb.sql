
ALTER TABLE public.curriculum_modules ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS teaching_outcomes text;
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS hours integer;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_hours integer;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_outcomes text[];
