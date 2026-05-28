ALTER TABLE public.curriculum_modules ADD COLUMN IF NOT EXISTS prerequisites text;
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS content_delivery_methods text;