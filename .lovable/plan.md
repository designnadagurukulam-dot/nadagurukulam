

# Tutor Dashboard — 10 Targeted Changes

## Summary
Restructure the tutor dashboard sidebar, live classes (online/offline tabs with master link auto-fill), My Courses page (tutor-created content only), analytics (4 sections with assignment completion), and add admin ability to manage tutor master meeting links. Requires 2 DB migrations and changes to 5 existing files + 1 new admin tutor detail section.

## Database Migrations

### Migration 1: Add master links to profiles
```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS zoom_link TEXT,
  ADD COLUMN IF NOT EXISTS meet_link TEXT;
```

### Migration 2: Add fields to live_classes + update RLS
```sql
ALTER TABLE live_classes 
  ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'specific';

-- Update student visibility policy
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
```

## File Changes

### 1. `src/components/DashboardSidebar.tsx`
- Remove "Curriculum" and "My Students" from `instructorNav`
- Rename "Create Course" → "Update Curriculum"
- Reorder: Overview, My Courses, Update Curriculum, Live Classes, Assignments, Messages, Analytics, Profile

### 2. `src/pages/instructor/InstructorCourses.tsx` — Full rewrite
- Add tabs: "My Courses" + "My Curriculum Modules"
- My Courses tab: query `courses` where `instructor_id = user.id`
- My Curriculum tab: query `curriculum_sections` where `created_by = user.id`, joined with `curriculum_modules`
- Each item shows title, date, batch, edit button
- Disable delete for content linked to active batches with enrolled students

### 3. `src/pages/instructor/TutorLiveClasses.tsx` — Major rewrite
- Replace 2-tab (Upcoming/Past) with 3-tab (Online/Offline/Past)
- **Online tab**: upcoming `live_classes` where `class_type = 'online'`, with "+ Schedule Online Class" button
- **Offline tab**: read-only `schedules` where `instructor_id = user.id`, with "Scheduled by Admin" badge, no join button
- **Past tab**: combined past online + offline
- **Schedule modal**: 
  - Class title, description, audience (All Batches / Specific Batch radio), date, time, duration (15/30/45/60 max), platform (Zoom/Meet radio)
  - Meeting link auto-filled from `profiles.zoom_link` or `profiles.meet_link` (read-only)
  - 60-min yellow warning banner about free plan limits
  - If no link set, show red error and disable save
  - Insert with `class_type = 'online'`, `audience_type`, `batch_id` (null for all)
- **Card badges**: Online vs Classroom visual distinction; All Batches vs Specific Batch badge

### 4. `src/pages/instructor/InstructorAnalytics.tsx` — Full rewrite
- **Section 1 — My Courses**: total courses, most accessed, avg completion, bar chart top 5
- **Section 2 — My Curriculum**: total modules created, total sections, module list with section count
- **Section 3 — My Batches**: total active batches, total students, per-batch cards with student count, pie chart
- **Section 4 — Assignment Completion**: total/submitted/pending stats, per-assignment table with completion %, bar chart with color-coded bars

### 5. `src/pages/admin/AdminStudents.tsx` — Add master links section
- When viewing a tutor profile (role = instructor), show "Master Meeting Links" section
- Zoom link + Meet link inputs, editable only by super_admin
- Save button updates `profiles.zoom_link` and `profiles.meet_link`
- Note: The admin/tutors route already renders `AdminStudents` — we add the links section to the tutor detail view within this component

### 6. `src/pages/dashboard/StudentLiveClasses.tsx` — Update query
- Update the student live classes query to handle the new `audience_type = 'all'` classes (RLS handles visibility, but UI should show "All Batches" badge)

## Technical Notes
- No new dependencies needed — uses existing recharts, framer-motion, Lucide icons, Tabs, RadioGroup, Dialog
- New Lucide icons: `AlertTriangle`, `Building2`, `Radio`
- All changes maintain existing mobile responsiveness patterns
- The `assignments` table uses `instructor_id` not `created_by` — queries will use `instructor_id = user.id`
- `curriculum_sections` has `created_by` field for filtering tutor-created content

