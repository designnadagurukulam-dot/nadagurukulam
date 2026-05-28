ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS curriculum_module_id uuid;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS curriculum_topic_id uuid;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS reference_text text;
ALTER TABLE public.assignments ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.curriculum_sections ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'Theory';