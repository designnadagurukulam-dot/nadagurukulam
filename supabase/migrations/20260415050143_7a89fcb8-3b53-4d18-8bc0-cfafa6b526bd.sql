
-- Change 5: Student edits own ungraded submission
CREATE POLICY "Student edits own ungraded submission" ON assignment_submissions
FOR UPDATE USING (student_id = auth.uid() AND grade IS NULL);

-- Change 6: Multi-category feedback
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]';

-- Change 8: Super admin message moderation - update existing policy
DROP POLICY IF EXISTS "Users see own messages" ON messages;
CREATE POLICY "Users see own messages or super admin sees all" ON messages
FOR SELECT USING (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
