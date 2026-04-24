

# Phase 3 — End-to-End Integration Audit & Wire-Up

The Phase 1 and Phase 2 work added many features tab-by-tab. Now we need to make sure every piece is **wired together end-to-end** so admin actions flow correctly to tutors and students, and vice-versa. This plan audits each feature loop and fixes any broken or missing connections.

## Goals

1. Verify every admin-side action surfaces correctly on the tutor and student side.
2. Verify every tutor/student-side action surfaces correctly to admin.
3. Confirm RLS, routes, sidebars, badges and notifications all line up.
4. No new features — only connect, fix, and validate what already exists.

## Integration loops to audit & fix

### 1) Verification loop
- Admin verifies user → tutor/student gains dashboard access → activity log entry → badge clears.
- **Check:** `is_verified` flips correctly, ProtectedRoute redirects work, sidebar pending count drops.

### 2) Subject Allocation → Tutor Courses → Student visibility
- Admin allocates subject to tutor → tutor sees subject in "My Courses" → student in linked batch sees it in curriculum.
- **Check:** `subject_allocations` → `curriculum_modules` → `batch_enrollments` chain renders end-to-end.

### 3) Curriculum hierarchy
- Admin/tutor adds Semester → Course → Module → Topic → Materials.
- **Check:** all four levels visible to enrolled students; YouTube + PDF + audio render in lesson player.

### 4) Live Classes loop
- Admin sets tutor's Zoom/Meet link → tutor schedules class → student in batch sees class on dashboard → Join button activates 10 min before start → activity log captures join.
- **Check:** missing-link warning shows, audience_type ('specific' vs 'all') filters correctly.

### 5) Assignments loop
- Tutor creates assignment → student in enrolled course sees it → student submits → tutor grades → student sees grade + feedback → notification fires.
- **Check:** "In Progress" status, R/A/G urgency colors, ungraded badge updates.

### 6) Timetable loop
- Admin creates schedule (Class/Live/Exam/etc.) with auto-populated tutor/semester → tutor sees it on their schedule → student sees it on their schedule → overlap warning fires on conflicts → semester filter works.
- **Check:** stacked entries render in same time slot; override deletes old correctly.

### 7) Events loop (admin + tutor + student)
- Admin event → publishes to public site (if active) and internal calendar.
- Tutor/student internal event → goes to admin Approval Queue → on approve, surfaces on Events page for all internal users → overlap with timetable warns creator.
- **Check:** `approval_status='pending'` flow, `is_internal=true` hides from public, sidebar Events link present for all roles.

### 8) Feedback loop
- Student submits feedback → admin sees in Feedback tab → admin replies → student sees reply on their Feedback page → `read_by_admin` flips → sidebar feedback badge clears.
- **Check:** category comments stay visible, rating filter labels correct, From/To date labels visible, replies render via `feedback_responses` join.

### 9) Tutor's Courses (rename + filters + archive)
- Filters by Tutor / Program / Type / Semester / Status all functional.
- Search matches title + tutor + program + topic.
- Archive sets `archived_at`, Restore clears it, Archived tab visible.
- **Check:** archived courses hidden from student dashboard.

### 10) Programs (renamed Categories) as single source of truth
- "Programs" list drives the Program dropdown in Subject Allocation, Tutor's Courses filter, and Faculty designation.
- **Check:** alphabetical sort everywhere, no leftover "Categories" labels.

### 11) Jobs & Volunteers
- Departments dropdown sourced from `job_departments`.
- Qualification + Experience required fields render on public Jobs page.
- Past openings tab shows `is_active=false` jobs with re-activate option.
- Same Past view for volunteers.

### 12) Activity Log
- Action filter shows friendly labels (mapped via `activityLabels.ts`).
- Newly added actions (feedback.replied, event.approved, course.archived, etc.) appear with friendly names.

### 13) Notification badges (final pass)
- Verification → unverified count only.
- Course Approvals → pending only.
- Assignments → ungraded only.
- Messages → unread only.
- Feedback → `read_by_admin=false` only.
- Events (admin) → pending approval count.
- Inquiries → new only.
- **Check:** all badges hide when count = 0; no double-counting.

### 14) Global polish
- Alphabetical sort on every name dropdown across admin + tutor pages (single helper).
- Date-range inputs labeled "From date" / "To date" everywhere they appear.
- Sidebar: confirm no duplicate Subject Allocation entry, Events link present for student + tutor + admin.

## Database

No new tables. Two small additions if missing:
- Add missing `activity_logs` action keys to friendly-label map.
- Add `event.approved` / `event.rejected` action emission when admin handles approval queue.

## Files to touch

- `src/components/DashboardSidebar.tsx` — final badge + nav cleanup
- `src/lib/activityLabels.ts` — extend friendly map
- `src/lib/activityLogger.ts` — emit new event approval actions
- `src/pages/admin/AdminEvents.tsx` — log approval/rejection
- `src/pages/admin/AdminFeedback.tsx` — mark `read_by_admin=true` on open
- `src/pages/admin/AdminCourses.tsx` — confirm archived hidden from student lists
- `src/pages/admin/AdminSchedule.tsx` — confirm overlap detection covers Events too
- `src/pages/dashboard/DashboardEvents.tsx` & `src/pages/instructor/TutorEvents.tsx` — confirm approval-queue overlap warning
- `src/pages/dashboard/DashboardSchedule.tsx` & `src/pages/instructor/TutorLiveClasses.tsx` — confirm new event types render
- `src/pages/dashboard/StudentFeedback.tsx` — confirm replies render
- `src/lib/sortHelpers.ts` (new, tiny) — `sortByName()` used everywhere dropdowns are populated

## Implementation order

1. Audit + fix sidebar badges (single source of truth for unread counts)
2. Mark feedback as read on admin open + extend friendly action labels
3. Wire event approval actions into activity log
4. Apply alphabetical sort helper across all name dropdowns
5. Confirm archived courses filter on student-facing queries
6. Confirm timetable overlap detection includes Event entries
7. Manual end-to-end walkthrough for each of the 14 loops
8. Build validation + TS check

## What this plan deliberately does NOT do

- No new database tables.
- No new user-facing features (tabs, pages, fields).
- No design changes.

This is purely a "make sure everything talks to everything" pass.

