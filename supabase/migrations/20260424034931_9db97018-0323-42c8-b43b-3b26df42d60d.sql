-- 1. feedback_responses table
CREATE TABLE public.feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL,
  responder_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage feedback responses"
ON public.feedback_responses
FOR ALL
TO authenticated
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Students view replies to own feedback"
ON public.feedback_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.feedback f
    WHERE f.id = feedback_responses.feedback_id
      AND f.student_id = auth.uid()
  )
);

CREATE TRIGGER trg_feedback_responses_updated_at
BEFORE UPDATE ON public.feedback_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. feedback.read_by_admin
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS read_by_admin boolean NOT NULL DEFAULT false;

-- Allow admins to update feedback (mark as read)
CREATE POLICY "Admins update feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

-- Students can view their own feedback (so they can see their submitted ones)
CREATE POLICY "Students view own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- 3. event_types table
CREATE TABLE public.event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#7D1E24',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event types"
ON public.event_types FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage event types"
ON public.event_types FOR ALL TO authenticated
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

-- Seed default event types
INSERT INTO public.event_types (name, color) VALUES
  ('Cultural', '#7D1E24'),
  ('Workshop', '#C49A3C'),
  ('Concert', '#5A1318'),
  ('Festival', '#9B6B2E'),
  ('Lecture', '#3D5A80'),
  ('Class Activity', '#7D8C5C')
ON CONFLICT (name) DO NOTHING;

-- 4. job_departments table
CREATE TABLE public.job_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job departments"
ON public.job_departments FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage job departments"
ON public.job_departments FOR ALL TO authenticated
USING (public.is_super_or_admin(auth.uid()))
WITH CHECK (public.is_super_or_admin(auth.uid()));

INSERT INTO public.job_departments (name) VALUES
  ('Music'),
  ('Dance'),
  ('Visual Arts'),
  ('Administration'),
  ('Operations'),
  ('Outreach')
ON CONFLICT (name) DO NOTHING;

-- 5. events new columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS map_url text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- Allow tutors and students to insert internal events (pending approval)
CREATE POLICY "Tutors and students create internal events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND is_internal = true
  AND approval_status = 'pending'
  AND (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'student'))
);

-- Authenticated users can view approved internal events
CREATE POLICY "Authenticated users view approved events"
ON public.events
FOR SELECT
TO authenticated
USING (approval_status = 'approved' OR created_by = auth.uid() OR public.is_super_or_admin(auth.uid()));

-- Allow creators to delete their own pending events
CREATE POLICY "Creators delete own pending events"
ON public.events
FOR DELETE
TO authenticated
USING (created_by = auth.uid() AND approval_status = 'pending');

-- 6. courses new columns
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS course_type text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.categories(id);

-- 7. job_postings new columns
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS experience_required text DEFAULT 'open';