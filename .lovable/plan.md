# Phase 17 — Courses Restructure, Curriculum Unification & Overview Blocks

## 1. Student "My Courses" — three sub-tabs
Convert `src/pages/dashboard/DashboardCourses.tsx` from its current two-tab layout into three tabs:

- **My Curriculum** — courses the student receives through admin-allocated batches. Source: `batch_enrollments` → `batches.course_id`.
- **My Courses** — extra courses the student self-enrolled into. Source: `enrollments` for the user, excluding any course already present in the batch list above.
- **Explore Courses** — approved faculty-created courses the student has not enrolled in yet (existing logic, kept as the third tab).

Each card in all three tabs shows: Program name (`courses.program` / category), Faculty name (instructor profile), Program Duration (`duration_hours` or `duration_weeks`), Semester (from batch when available), and a progress % bar (existing `lesson_progress` computation).

## 2. Remove "Curriculum" from Student sidebar
- Delete the standalone `{ label: "Curriculum", to: "/dashboard/student/curriculum" }` entry in `src/components/DashboardSidebar.tsx`.
- Keep the `/dashboard/student/curriculum` route working (cards in "My Curriculum" tab deep-link into it for the unified curriculum viewer described in §3).

## 3. Unified Curriculum Viewer (Student, Admin, Super Admin)
Refactor the curriculum reading experience into a shared component `src/components/curriculum/CurriculumViewer.tsx` used by:
- `src/pages/dashboard/DashboardCurriculum.tsx` (student)
- `src/pages/admin/AdminCurriculum.tsx` (admin / super admin)

Layout (fixed-height, internal scroll — no whole-block expansion):

```text
┌──────────────────────────────────────────────────────────────┐
│  Course Name  (larger heading)                               │
│  Course Code · Faculty Name · [Batches: A, B] (admin only)   │
├──────────────┬───────────────────────────────────────────────┤
│  Modules     │   Topic Title                                 │
│  ▸ Module 1  │   ───────────────────────────────             │
│    (5 topics)│   [scrollable topic content + media filters]  │
│  ▸ Module 2  │                                               │
│    (3 topics)│                                               │
└──────────────┴───────────────────────────────────────────────┘
```
- Container height fixed (~`h-[70vh]` desktop, full viewport on mobile) matching the size seen when "Raga Lakshanas" module is currently expanded.
- Left rail = scrollable module list with topic counts (existing pattern reused).
- Right pane = scrollable topic detail; selecting a module/topic only changes the right pane, never resizes the outer container.
- Header line includes Course Name (larger), Course Code, Faculty name. Batches list rendered only when `role in (admin, super_admin)`.

## 4. Remove "Live Classes" sidebar entry — all roles
Delete the Live Classes nav item from `studentNav`, `instructorNav`, and `adminNav` (so super_admin inherits the change too) in `src/components/DashboardSidebar.tsx`. Keep the underlying routes for deep links.

Add an equivalent block on each role's Overview:
- **Faculty (`InstructorOverview.tsx`)** — insert a "Live Classes" block immediately **above** the Teaching Activity block. Two inner tabs: **Upcoming (n)** and **Past (n)** sourced from `live_classes` filtered by `instructor_id`. Each row: title, batch/audience, date-time, duration, Join button (existing 10-min-window logic).
- **Student (`DashboardOverview.tsx`)** — promote the existing "Online Classes" today block into a fuller "Live Classes" block with **Upcoming / Past** tabs (audience filter: batch-specific or `audience_type='all'`).
- **Admin / Super Admin (`AdminOverview.tsx`)** — add a "Live Classes" block with **Upcoming / Past** tabs (all classes, read-only summary linking through to the existing page).

## 5. Faculty Overview — replace "Recent Submissions" with "Events for Today"
In `src/pages/instructor/InstructorOverview.tsx`, replace the Recent Submissions section (≈lines 386–474) with an "Events for Today" block listing rows from `events` where `event_date::date = current_date`, `approval_status='approved'`, `is_active=true`. Each row: title, time, location, event_type chip. Empty state mirrors existing styling.

## 6. Assignments — show "Program" before "Course"
Update assignment row rendering in:
- `src/pages/instructor/InstructorAssignments.tsx` (line 275)
- `src/pages/dashboard/DashboardAssignments.tsx` (matching row)
- `src/pages/admin/AdminAssignments.tsx` (if it renders the same row)

Replace `Course: {title}` with two lines/inline chips:
```
Program: {courses.program ?? courses.categories?.name ?? "—"}
Course:  {courses.title ?? "—"}
```
Fetch `program` / category in the existing select where missing.

## Technical Notes
- No database migrations required. All splits rely on existing tables: `batch_enrollments`, `batches`, `enrollments`, `courses`, `profiles`, `live_classes`, `events`, `assignments`.
- `CurriculumViewer` component centralises queries it already does in both files; admin variant simply passes `showBatches` prop and a batches lookup.
- Faculty name resolution reuses the two-step query pattern already memoised in `query-pattern-live-classes`.
- Sidebar count logic for "Live Classes" (none today) is unaffected; assignment/messages counts remain.
- Routes preserved so existing bookmarks / deep links keep working; only nav entries are removed.

## Files Touched
**Edit**
- `src/components/DashboardSidebar.tsx` (remove Curriculum + Live Classes entries)
- `src/pages/dashboard/DashboardCourses.tsx` (3 sub-tabs, new query split)
- `src/pages/dashboard/DashboardCurriculum.tsx` (use shared viewer)
- `src/pages/admin/AdminCurriculum.tsx` (use shared viewer)
- `src/pages/instructor/InstructorOverview.tsx` (Live Classes block + Events for Today swap)
- `src/pages/dashboard/DashboardOverview.tsx` (expand Online Classes → Live Classes Upcoming/Past tabs)
- `src/pages/admin/AdminOverview.tsx` (add Live Classes Upcoming/Past block)
- `src/pages/instructor/InstructorAssignments.tsx`, `src/pages/dashboard/DashboardAssignments.tsx`, `src/pages/admin/AdminAssignments.tsx` (Program label)

**New**
- `src/components/curriculum/CurriculumViewer.tsx` (shared fixed-height two-panel viewer)
- `src/components/overview/LiveClassesBlock.tsx` (shared Upcoming/Past tabs block, role-aware)
