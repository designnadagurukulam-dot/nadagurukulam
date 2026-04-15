

# 8 Student Dashboard Changes — Implementation Plan

## Summary
Eight targeted changes to the Student Dashboard plus one Super Admin page. Includes 3 DB migrations, 6 modified files, and 2 new files.

## Database Migrations

### Migration: Combined schema changes
```sql
-- Change 5: Student edits ungraded submission (additive — existing policies stay)
CREATE POLICY "Student edits own ungraded submission" ON assignment_submissions
FOR UPDATE USING (student_id = auth.uid() AND grade IS NULL);

-- Change 6: Multi-category feedback
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]';

-- Change 8: Super admin message moderation
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
```

## File Changes

### 1. `src/pages/dashboard/DashboardOverview.tsx`
- **Change 1**: Below the study activity bar chart, add a "Recent Activity" list showing last 5 `lesson_progress` entries joined with `course_lessons` for title, with material type icon (PDF/Video/Audio) and "time ago" label. Query `lesson_progress` where `user_id = auth.uid()`, join `course_lessons` via `lesson_id`, order by `updated_at DESC`, limit 5.
- **Change 2**: Make stat cards clickable — wrap "Classes This Week" with `navigate('/dashboard/student/live-classes')`, "Pending Assignments" with `navigate('/dashboard/student/assignments')`, "Study Progress" with `navigate('/dashboard/student/curriculum')`. Add `cursor-pointer`, `hover:border-[#C49A3C]`, and a `ChevronRight` icon that appears on hover. Make each upcoming class card and pending assignment card clickable to their respective pages.

### 2. `src/pages/dashboard/DashboardCurriculum.tsx`
- **Change 3**: Already has a detailed subject panel with chapters and topics. No major structural change needed — the `SubjectPanel` component already shows subjects with chapter sidebar and topic content. Enhance by making subject cards in the top-level list clickable to scroll/expand into detail. If not already expandable, add an expand-on-click behavior to each subject heading that opens the two-panel `SubjectPanel` view.
- **Change 4**: In the PDFs section of `TopicContent`, replace the direct `<a>` link with a click handler that shows a small popover with two options: "Preview here" (expands inline iframe) and "Open in new tab" (opens URL). Add state `previewingPdfId` to track which PDF is being previewed inline. Show iframe with `src={url}#toolbar=0&navpanes=0` height 400px with close button.

### 3. `src/pages/dashboard/DashboardAssignments.tsx`
- **Change 5**: In the "Submitted" tab, add an "Edit Submission" button on cards where `submission.grade === null`. Clicking opens a dialog with pre-filled `text_content`, file display with remove option, and file upload. On save, UPDATE `assignment_submissions` with new text/file. If `grade` is not null, show "Graded — cannot edit" muted text instead.

### 4. `src/pages/dashboard/StudentFeedback.tsx`
- **Change 6**: Redesign form to support multiple category blocks. State changes from single `{category, rating, message}` to array `[{category, rating, comment}]`. Each block has category dropdown, star rating, and comment textarea. "+ Add another category" dashed button appends new block. X remove on all blocks except first. On submit, insert with `categories` JSONB column containing the array. Keep the single `message` column for backward compatibility by joining all comments.

### 5. `src/pages/admin/AdminFeedback.tsx`
- **Change 6 continued**: When rendering each feedback row, check for `categories` JSONB field. If present, show expandable list of categories with individual ratings and comments. Fall back to legacy `category + rating + message` display if `categories` is empty/null.

### 6. `src/components/DashboardSidebar.tsx`
- **Change 7**: Make the "Earn Your Certificate" card clickable — wrap in `button` with `onClick={() => navigate('/dashboard/student/courses')}`, add hover effect and "View My Courses →" text line.
- **Change 8A**: Rename "Chat" to "Reach Out" in `studentNav`.
- **Change 8E**: Add "Message Monitor" to `superAdminNav` only (not `adminNav`), pointing to `/dashboard/admin/messages`.

### 7. `src/pages/dashboard/StudentChat.tsx`
- **Change 8B**: Rename page title "Chat" → "Reach Out", subtitle → "Message any staff member". Change tutor query to fetch ALL verified instructors + admins instead of only batch tutors. Query `user_roles` for `role IN ('instructor', 'admin')` joined with `profiles` where `is_verified = true`. Add a search input at top of staff list to filter by name.

### 8. `src/pages/admin/AdminMessages.tsx` (NEW)
- **Change 8E**: New page for Super Admin message monitoring. Left panel: list all conversations (distinct sender+receiver pairs from `messages` table), showing participant names and last message preview. Right panel: read-only message thread for selected conversation. No send button. Access guarded by `super_admin` role check — show "Access Denied" for regular admin.

### 9. `src/App.tsx`
- Add route `/dashboard/admin/messages` pointing to `AdminMessages` component, restricted to `super_admin` role.

## Technical Notes
- Change 1 queries `lesson_progress` joined with `course_lessons` (not `study_materials` which doesn't exist — using actual table names)
- Change 3 uses existing `SubjectPanel` architecture — no new routes needed since the curriculum page already has the two-panel layout
- Change 7 navigates to existing `/dashboard/student/courses` rather than creating a new "My Courses" page (the existing `DashboardCourses` page serves this purpose)
- Change 8 RLS update replaces existing "Users see own messages" policy with super_admin visibility
- All existing routes preserved — only additive changes
- No new dependencies required

