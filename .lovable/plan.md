

# Phase 2 — Admin Tab Refinements

This plan covers the next round of admin changes across Feedback, Timetable, Events, All Courses, Categories, Jobs, Subject Allocation removal, Activity Log and notification badges.

---

## 1) Feedback tab (`AdminFeedback.tsx`)

- Remove the **Anonymous** stat tile.
- Replace it with a small **Rating Distribution** summary tile (compact, alongside Total + Avg).
- Always show submitter's name (no more "Anonymous"). The `is_anonymous` flag will be ignored for Super Admin view; we'll still keep it in the column for future guest use.
- Rating filter labels change from `"1★ and above"` → `"1 star rating"`, `"2 star rating"`, … `"Above 4 star rating"` (only the 5-star option will read "5 star rating", the 4-star option becomes "Above 4 star rating" per your wording).
- Date inputs get visible labels: **"From date"** and **"To date"**.
- When the categories toggle is collapsed, the per-category comments must remain visible — restructured so each comment is shown grouped under its category badge regardless of toggle state. Toggle now only collapses the score breakdown chart, not the comments themselves.
- Add an **Admin reply** field on each feedback row: text area + Send button. Stored in a new `feedback_responses` table. Student sees the reply in their Feedback page.

## 2) Global sorting standard (alphabetical names)

- All dropdown lists of names (tutors, students, categories, courses, batches, programs, departments, designations) sorted **alphabetically** by display name across the entire admin section. Will be applied as a one-line sort wherever options are rendered.

## 3) Timetable tab (`AdminSchedule.tsx`)

- Event types updated to: **Class, Live class, CIE, Exam, Preparation Holidays, Rehearsals, Holiday, Event**.
- Form simplified: select **Batch** + **Subject (course)** only. Semester, Tutor and Course Code auto-populate from the curriculum module / batch mapping (read-only display).
- Add an **"Add Schedule"** button (top-right) that opens the slot dialog directly without needing to click a calendar cell. The dialog supports adding multiple parallel entries in one slot — saved entries in the same time block render stacked inside one calendar cell.
- **Overlap detection**: before save, check for collisions on (batch, instructor, subject, time range). If found, show a warning dialog listing conflicts with **Override** (delete old, save new) or **Cancel** options.
- Add a **Semester filter** pill alongside the existing Batch / Tutor filters.

## 4) Events tab (`AdminEvents.tsx`)

- Event types become editable: a small **Manage Event Types** dialog (list + add + delete) backed by a new `event_types` table. The Type dropdown is populated from this table.
- **Location** field gets a second input: **Map URL / Pin** (Google Maps link). On the public Events page, location renders as a clickable link opening directions.
- **Drag & drop image upload** for the event image — uploads into the existing `curriculum-materials` bucket (public). Uses native HTML5 drop + file picker; replaces the current "Image URL" text field.
- Clarify the `is_active` switch: rename label to **"Publish on public website"**. When OFF, event is internal-only (visible to logged-in students/staff calendar but hidden from public `/events`).
- **Tutor & Student events**: add a new public events page (`/dashboard/student/events`, `/dashboard/tutor/events`) so they can view all approved events (admin's plus internal). Both can also create internal-only events that go through admin approval.
- New `events.created_by` column + `approval_status` (`pending` / `approved` / `rejected`). Admin events auto-approved. Tutor/student events default to `pending`.
- Overlap warning: when a tutor/student creates an event that conflicts with an existing schedule, show a notification with the conflicting timetable title and a "Create anyway" / "Cancel" choice.
- Pending events show in a new admin tab **"Approval Queue"** inside Events.

## 5) All Courses tab (`AdminCourses.tsx`)

- Rename to **"Tutor's Courses"** (sidebar + page heading).
- Add filters: **By Tutor**, **By Program**, **By Semester**, **By Type (Online/Offline)**, **All Status** (existing).
- Search bar matches against: course title, tutor display_name, program name, or curriculum topic title (via union query).
- Course cards become clickable to open a detail panel (re-using existing course detail view).
- Replace hard delete with **Archive** / **Restore**. New `courses.archived_at` (timestamp). Add an **"Archived"** tab/filter showing past courses with a Restore + Duplicate button.

## 6) Categories tab — clarification

The Categories tab currently manages the legacy public-facing course category taxonomy (Carnatic Vocal, Tabla, etc.) used by the old marketing pages. Since you've moved to **Programs** managed inside the curriculum, this tab is largely redundant. Recommendation: **rename Categories → Programs** and use it as the master list that drives every "Program" dropdown across the admin section (Subject Allocation, Tutor's Courses filter, etc.). I'll wire it up as the single source of truth.

## 7) Jobs tab (`AdminJobs.tsx`)

- **Departments**: managed list — small "Manage Departments" dialog backed by a new `job_departments` table; Department field becomes a dropdown sourced from it.
- **Qualification** field added (text area).
- **Experience required**: dropdown (Fresher / 0-2 yrs / 2-5 yrs / 5+ yrs / Open to all).
- **Location**: already editable; we'll keep the existing input but make it required.
- **Past openings**: new tab/section showing inactive jobs (currently hidden); admin can re-activate or delete.
- Same **Past applications** view added under Volunteers tab (filter by status = dismissed/accepted historical).

## 8) Subject Allocation removal

- The standalone **Subject Allocation** entry under sidebar will be **removed**. Its functionality already lives under the renamed Teachers → Subject Allocation tab.
- Sidebar's `Subject Allocation` link now points to that one consolidated page, no duplicate.

## 9) Activity Log tab (`AdminActivityLog.tsx`)

- Action filter dropdown will use **friendly labels** instead of raw keys (e.g. `course.created` → "Course Created", `assignment.graded` → "Assignment Graded"). Mapping table maintained in code.

## 10) Notification badges (sidebar)

- Verification badge → only count profiles `is_verified = false` AND not yet reviewed (already correct, will verify).
- Assignments badge → only show **ungraded submissions** (currently does this — keeping).
- Feedback badge → currently shows **all feedback**; will change to only feedback that hasn't been read/responded to (new `feedback.read_by_admin` flag).
- Messages badge → unread only (already correct).
- Anywhere else (Approvals, Inquiries) → new/unread only.

---

## Database changes required

1. New table `feedback_responses` (id, feedback_id, responder_id, message, created_at).
2. New column `feedback.read_by_admin` (bool, default false) for accurate unread count.
3. New table `event_types` (id, name, color).
4. New table `job_departments` (id, name).
5. New columns on `events`: `map_url`, `created_by`, `approval_status`, `is_internal`.
6. New columns on `courses`: `archived_at`, `course_type` (online/offline), `program_id` (FK to categories).
7. New columns on `job_postings`: `qualification`, `experience_required`.
8. RLS for new tables and new columns; tutor/student INSERT on events allowed when `created_by = auth.uid()`.

No destructive changes — all existing data preserved.

---

## Files to be edited / created

- `src/pages/admin/AdminFeedback.tsx`
- `src/pages/admin/AdminSchedule.tsx`
- `src/pages/admin/AdminEvents.tsx`
- `src/pages/admin/AdminCourses.tsx`
- `src/pages/admin/AdminCategories.tsx` (rename UI → Programs)
- `src/pages/admin/AdminJobs.tsx`
- `src/pages/admin/AdminActivityLog.tsx`
- `src/pages/dashboard/StudentFeedback.tsx` (show admin reply)
- `src/pages/dashboard/DashboardEvents.tsx` (NEW)
- `src/pages/instructor/TutorEvents.tsx` (NEW)
- `src/components/DashboardSidebar.tsx` (add events link for tutors/students, remove duplicate Subject Allocation)
- `src/App.tsx` (new routes for tutor/student events)
- New Supabase migration file for schema changes

---

## Implementation order

1. Database migrations (new tables + columns + RLS)
2. Sidebar cleanup (remove duplicate Subject Allocation, add events for tutor/student)
3. Feedback tab refinements + admin reply
4. Timetable tab (event types, auto-populate, Add Schedule button, overlap detection, semester filter)
5. Events tab (drag-drop upload, map URL, types manager, approval flow, tutor/student access)
6. Tutor's Courses (rename, filters, search, archive)
7. Categories → Programs rename + wiring
8. Jobs (departments, qualification, experience, past openings)
9. Activity Log friendly labels
10. Notification badge corrections
11. Build validation

---

## Open questions before I start

1. For the **overlap warning** in Timetable — should the "Override" button replace the older entry silently, or notify the affected tutor/students by email/notification?
2. For **tutor/student event approval** — do you want admin to receive a notification (bell icon) when a new event is submitted, or just rely on the new approval queue tab?
3. For **archived courses** — should archived courses still be visible to enrolled students (in their dashboard) or hidden completely?

I'll proceed with sensible defaults if you don't answer (silent override + bell notification + hidden from students), but tell me if you'd prefer otherwise.

