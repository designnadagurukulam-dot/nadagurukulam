CREATE POLICY "Instructors can insert own schedules"
ON public.schedules
FOR INSERT
TO authenticated
WITH CHECK (instructor_id = auth.uid() AND user_id = auth.uid());

CREATE POLICY "Instructors can delete own extra schedules"
ON public.schedules
FOR DELETE
TO authenticated
USING (instructor_id = auth.uid() AND schedule_type = 'extra');