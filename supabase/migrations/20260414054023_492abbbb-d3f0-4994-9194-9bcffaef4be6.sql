
-- Migration 1: Add master links to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS zoom_link TEXT,
  ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- Migration 2: Add fields to live_classes
ALTER TABLE live_classes 
  ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'specific';

-- Update student visibility policy for live_classes
DROP POLICY IF EXISTS "Students view live classes for their batch" ON live_classes;
CREATE POLICY "Students view live classes" ON live_classes FOR SELECT USING (
  (
    audience_type = 'all' AND instructor_id IN (
      SELECT b.instructor_id FROM batches b
      WHERE b.id IN (SELECT be.batch_id FROM batch_enrollments be WHERE be.student_id = auth.uid())
    )
  )
  OR (
    audience_type = 'specific' AND batch_id IN (
      SELECT be.batch_id FROM batch_enrollments be WHERE be.student_id = auth.uid()
    )
  )
  OR is_super_or_admin(auth.uid())
  OR (instructor_id = auth.uid())
);
