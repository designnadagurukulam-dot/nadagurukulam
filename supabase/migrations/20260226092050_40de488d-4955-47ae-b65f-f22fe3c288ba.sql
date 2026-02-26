-- Content Reviews / Approval Workflow table
CREATE TABLE public.content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  reviewer_id uuid,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own course reviews" ON public.content_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = content_reviews.course_id AND courses.instructor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can submit for review" ON public.content_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE courses.id = content_reviews.course_id AND courses.instructor_id = auth.uid())
  );

CREATE POLICY "Admins can update reviews" ON public.content_reviews
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews" ON public.content_reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Also allow students to self-enroll (insert) upon payment
CREATE POLICY "Students can self-enroll" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow students to update their own enrollment progress
CREATE POLICY "Students can update own enrollment" ON public.enrollments
  FOR UPDATE USING (auth.uid() = user_id);
