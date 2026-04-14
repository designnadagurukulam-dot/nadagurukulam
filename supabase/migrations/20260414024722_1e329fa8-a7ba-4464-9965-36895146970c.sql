
-- Allow authenticated users to see profiles of instructors they interact with
CREATE POLICY "Students can view instructor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- The profile belongs to an instructor in a batch the student is enrolled in
  EXISTS (
    SELECT 1 FROM batch_enrollments be
    JOIN batches b ON b.id = be.batch_id
    WHERE be.student_id = auth.uid()
      AND b.instructor_id = profiles.user_id
  )
  OR
  -- The profile belongs to an instructor of a live class in the student's batch
  EXISTS (
    SELECT 1 FROM live_classes lc
    JOIN batch_enrollments be ON be.batch_id = lc.batch_id
    WHERE be.student_id = auth.uid()
      AND lc.instructor_id = profiles.user_id
  )
  OR
  -- The profile belongs to someone the student has exchanged messages with
  EXISTS (
    SELECT 1 FROM messages m
    WHERE (m.sender_id = auth.uid() AND m.receiver_id = profiles.user_id)
       OR (m.receiver_id = auth.uid() AND m.sender_id = profiles.user_id)
  )
);
