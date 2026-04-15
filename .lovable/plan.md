

# Admin Panel Integration — Full Alignment with Student & Tutor Dashboards

## Summary
Audit and upgrade all admin panel pages to ensure proper integration with recent student dashboard changes (multi-category feedback, Reach Out messaging, editable submissions, recent activity) and tutor dashboard changes (live classes with online/offline/past tabs, master meeting links, audience segmentation, assignment completion analytics). This involves updating 8 existing admin pages, enhancing the admin overview with new metrics, and adding missing admin-side views for features that currently exist only in student/tutor dashboards.

---

## Changes

### 1. AdminOverview.tsx — Add Missing Stat Cards & Quick Actions
**Current gap**: Overview doesn't show ungraded submissions count, unread messages, or new feedback count prominently.
- Add stat cards: "Ungraded Submissions" (count from `assignment_submissions` where `grade IS NULL`), "Unread Messages" (from `messages` where `is_read = false`)
- Add quick action: "Message Monitor" (only if super_admin)
- Replace random mock `activityData` with real activity counts from `activity_logs` grouped by day for the current week
- Add "Recent Feedback" quick link card showing latest feedback count

### 2. AdminFeedback.tsx — Full Multi-Category Support
**Current gap**: Filters only work on legacy `category` field, not on `categories` JSONB.
- Update category filter to scan inside `categories` JSONB array (if present) — extract all unique category names from both legacy `category` and JSONB `categories[].category`
- Update average rating calculation: for multi-category feedback, compute average across all category ratings, not just the top-level `rating` field
- Add a "Rating Distribution" mini chart (bar chart showing count of 1-5 star ratings)
- Add "Export Feedback" button (CSV download) for admin reporting

### 3. AdminLiveClasses.tsx — Align with Tutor Online/Offline/Audience Model
**Current gap**: Shows flat list without distinguishing online vs offline classes or audience type. No tutor master link visibility.
- Add a `class_type` filter tab or badge column: Online / Offline (matching tutor's model)
- Show `audience_type` badge: "All Batches" (gold) vs "Specific Batch" (default) on each row
- Add a column showing tutor's master Zoom/Meet link (from `profiles.zoom_link`/`profiles.meet_link`) when the class `meeting_link` matches the master link
- Add "LIVE NOW" count in the summary stats

### 4. AdminStudents.tsx — Add Master Meeting Link Management (Already Partially Done)
**Current state**: Already has a "Set Meeting Links" dialog for tutors. Verify it works correctly.
- Ensure the "Set Master Links" button only appears for users with `instructor` role
- Add a column or filter to show tutors who have NOT set their master links (missing `zoom_link` AND `meet_link`)
- Make the tutor filter show batch count and student count next to each tutor name

### 5. Admin Assignments Page (Currently Missing — Reuses AdminCourses)
**Current gap**: Route `/dashboard/admin/assignments` points to `AdminCourses` component, which is wrong — it shows courses, not assignments.
- Create a new `AdminAssignments.tsx` page that shows:
  - All assignments across all tutors with instructor name, course name, batch, due date, submission count
  - Summary stats: Total Assignments, Total Submissions, Ungraded count, Overdue count
  - Tabs: All / Pending Grading / Graded / Overdue
  - Click on an assignment row expands to show submissions with student name, submitted date, grade status
  - Admin can view but not edit grades (grading is tutor's responsibility)
- Update `App.tsx` to point `/dashboard/admin/assignments` to the new component

### 6. AdminMessages.tsx — Polish & Add Conversation Stats
**Current state**: Already functional for super_admin with read-only thread view.
- Add summary stats at top: Total Conversations, Total Messages, Active Today
- Add role badges next to participant names (Student / Instructor / Admin)
- Add "Flag Conversation" button on each thread that inserts a flag into message metadata
- Mobile responsive: stack left/right panels vertically on small screens

### 7. AdminSchedule.tsx — Show Tutor Live Classes in Timetable
**Current gap**: Schedule only shows admin-created schedule entries, not tutor-created live classes.
- Add a secondary section or tab "Live Classes" that pulls from `live_classes` table, showing them alongside admin schedules
- Show class_type (Online/Offline) badge and audience_type
- Keep admin schedule creation form as-is

### 8. AdminAnalytics.tsx — Add Assignment Completion & Feedback Analytics
**Current gap**: Analytics only shows enrollment, course, and revenue charts. Missing assignment and feedback analytics.
- Add Section: "Assignment Analytics" — total assignments, completion rate (submissions/assignments × enrolled students), average grade distribution
- Add Section: "Feedback Analytics" — average rating trend over time, category breakdown pie chart from JSONB `categories`
- Add Section: "Live Class Analytics" — total classes, online vs offline split, attendance (if tracked)
- Add Section: "Active Users" — daily active users from `activity_logs` grouped by date for last 30 days

### 9. AdminBatches.tsx — Show Linked Live Classes & Assignment Count
**Current gap**: Batch detail only shows enrolled students, not associated live classes or assignments.
- In the batch detail/enrollment dialog, add tabs: "Students" (existing) | "Live Classes" | "Assignments"
- "Live Classes" tab: query `live_classes` where `batch_id = batch.id`, show title, date, status
- "Assignments" tab: query `assignments` where `batch_id = batch.id`, show title, due date, submission count

### 10. App.tsx Route Fix
- Import new `AdminAssignments` component
- Update `/dashboard/admin/assignments` route to use `AdminAssignments` instead of `AdminCourses`

---

## Files Modified
1. `src/pages/admin/AdminOverview.tsx` — real activity data, new stats
2. `src/pages/admin/AdminFeedback.tsx` — JSONB-aware filters, export
3. `src/pages/admin/AdminLiveClasses.tsx` — class_type/audience badges
4. `src/pages/admin/AdminStudents.tsx` — master link completeness indicator
5. `src/pages/admin/AdminMessages.tsx` — stats, role badges, mobile responsive
6. `src/pages/admin/AdminSchedule.tsx` — live classes integration
7. `src/pages/admin/AdminAnalytics.tsx` — 4 new analytics sections
8. `src/pages/admin/AdminBatches.tsx` — linked live classes & assignments tabs
9. `src/App.tsx` — route fix for assignments

## New Files
1. `src/pages/admin/AdminAssignments.tsx` — dedicated assignments management page

## No Database Migrations Required
All data already exists in tables. This is purely UI/query integration work.

