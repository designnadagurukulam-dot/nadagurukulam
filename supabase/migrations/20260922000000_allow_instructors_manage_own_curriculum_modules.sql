-- The "Create Curriculum Module" dialog in the instructor dashboard (TutorCurriculum.tsx)
-- inserts into curriculum_modules with created_by = auth.uid(), but curriculum_modules only
-- ever had INSERT/UPDATE/DELETE policies for admins, so every instructor save was rejected
-- with 403 Forbidden by RLS. Allow instructors to manage the modules they created themselves.

CREATE POLICY "Instructors can insert own curriculum modules" ON public.curriculum_modules
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'instructor'::app_role)
);

CREATE POLICY "Instructors can update own curriculum modules" ON public.curriculum_modules
FOR UPDATE TO authenticated
USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'instructor'::app_role))
WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can delete own curriculum modules" ON public.curriculum_modules
FOR DELETE TO authenticated
USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'instructor'::app_role));
