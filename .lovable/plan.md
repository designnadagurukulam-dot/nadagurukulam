## Student Dashboard Overview — Restructure

Scope: `src/pages/dashboard/DashboardOverview.tsx` plus a couple of small new dialog components and a tab addition on the Courses page. UI-only; no schema changes.

### 1. Top tiles (all clickable)

**My Batch** — opens a dialog showing batch roster.
- Heading: batch name.
- Table columns: Name, Registered No. (renamed from Student ID everywhere it appears as a label), Semester (current), Program.
- Source: `batch_enrollments` → `profiles` + `student_registry` (semester, program) joined by `user_id`.

**My Classes** (renamed from "Classes This Week")
- Tile shows two numbers for **today**: Offline `N` · Online `N`.
- Click opens a dialog listing today's classes grouped Offline first, then Online; within each group sorted by start time.
- Columns per row: Title, Mode, Time, Duration.

**My Assignments** (renamed from "Pending Assignments")
- Value: pending count (unchanged).
- Click → `/dashboard/student/assignments`.

**Study Progress**
- Tile shows overall %.
- Click behavior:
  - If multiple enrolled courses → open a dialog listing each course with its progress bar; clicking a row navigates to `/dashboard/student/courses`.
  - If exactly one enrolled course → navigate directly to `/dashboard/student/courses`.

### 2. Study Activity block

- Keep the same per-day bar visualisation.
- Replace the current random mock with real per-day study minutes derived from `lesson_progress.updated_at` rows for the week (count distinct lessons touched per day × estimated minutes, falling back to a count if no duration available). Per-day stat capture stays daily and continues to show today highlighted.

### 3. Online Classes block (renamed from "Upcoming Classes")

- Show **today's online classes** only (either matching the student's batch_id OR `audience_type='all'`).
- Per row: Title, Faculty Name (already renamed elsewhere — confirm here), Time, Duration, **Join** button (enabled within window using existing `isClassLive` helper; otherwise disabled with tooltip "Available 10 min before start").

### 4. Events for Today block (replaces "Your Assignments" block)

- Replace the pending-assignments side block with an "Events for Today" block.
- Source: `events` where `event_date::date = today` AND `approval_status='approved'` AND `is_active=true`.
- Per row: title, time, location (if present), event_type chip. Empty state: "No events today".

### 5. Explore Courses entry point

- "Explore new courses" CTA (currently somewhere in this overview / sidebar) now routes to `/dashboard/student/courses?tab=explore`.
- On `DashboardCourses.tsx` add a second tab **Explore Courses** that lists all `courses` with `status='approved'` that the student is NOT yet enrolled in, with an Enroll action (insert into `enrollments`). The existing "My Courses" view becomes the first tab.

### Files

**Edited**
- `src/pages/dashboard/DashboardOverview.tsx` — tile labels/values/click handlers, replace random activity data with real query, rename Upcoming → Online Classes (today + join), swap assignments block → Events for Today.
- `src/pages/dashboard/DashboardCourses.tsx` — add Tabs with "My Courses" + "Explore Courses".
- Minor label sweep: any "Student ID" UI label → "Registered No." (search `rg -i 'student id' src -g '*.tsx'`).

**New**
- `src/components/dashboard/BatchRosterDialog.tsx`
- `src/components/dashboard/TodayClassesDialog.tsx`
- `src/components/dashboard/CourseProgressDialog.tsx`

### Out of scope this phase
- No DB migrations.
- Enrollment approval workflow on Explore Courses (direct self-enroll uses existing RLS `Students can self-enroll`).
- Per-second study-time tracking (we approximate from `lesson_progress` updates).
