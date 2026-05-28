# Phase 18 — Assignments, Schedule, Events refinements

## 1. Faculty Assignments (`InstructorAssignments.tsx`)

**Main listing columns** — change from `Title · Course · Module · Topic · Batch · Due` to:
`Title · Program · Course · Batch · Due Date & Time`

- Program = `courses.category` (fallback `—`); Course = `courses.title` (or `N/A` when no course selected).
- Mobile card mirrors same five fields.
- Click a row → opens detail dialog showing the full set (Title, Program, Course, Module, Topic, Batch, Description, Due Date, Reference files: PDF / video link / external link / reference text). Reuses same fields the Create dialog already captures.

**Create Assignment dialog** — already captures Title, Course, Module, Topic, Batch, Description, Due Date, plus PDF upload + video URL + external link + reference text. Keep as-is, just confirm the field labels and that Course/Module/Topic show an explicit `N/A` option (currently uses the `__na__` sentinel — make the label read "N/A").

## 2. Student Schedule (merge Live Classes into Schedule)

Sidebar already shows Schedule and no longer shows Live Classes. Update `DashboardSchedule.tsx` to:

1. Keep existing weekly timetable calendar block at the top (works for students via `batch_enrollments` → `schedules`).
2. Below it, render the existing `LiveClassesBlock` (`scope={{ kind: "student", batchIds }}`) — already supports Upcoming / Past tabs with counts and 10-minute Join window.
3. Rename page heading from "My Schedule" to "Schedule".

Leave `/dashboard/student/live-classes` route in place for deep links but it is no longer surfaced.

## 3. Student Assignments (`DashboardAssignments.tsx`)

**Card body** — add Faculty Name and Due Date alongside existing fields:
- Title
- Program (`courses.category`)
- Course (`courses.title`)
- Faculty Name (resolve `assignments.instructor_id` → `profiles.display_name`)
- Due Date & Time

Update data query to fetch instructor profiles for the assignments list.

**Detail view — convert dialog into a dedicated page**:
- New route `/dashboard/student/assignments/:id` → `DashboardAssignmentDetail.tsx`.
- Fetches assignment + course + instructor + module (`curriculum_modules.module_name`) + topic (`curriculum_topics.title`) + batch (`batches.name`) + student's own submission.
- Layout shows: Title, Program, Course, Module, Topic, Batch, Description/Instructions, Due Date & Time, Reference files section (PDF download, video link, external link, reference text), grade/feedback if graded, and a **Submit Assignment** button at the bottom.
- Clicking Submit opens the existing submit pop-up (file upload + text content) — extract current submit form JSX into a `SubmitAssignmentDialog` component reused from both the list (optional) and the detail page.

Card click navigates to the new route instead of opening the in-page dialog. Pending/Submitted/Graded tabs stay.

## 4. Events (calendar view for all roles)

Convert `DashboardEvents.tsx` (used by student + instructor) to match the Admin calendar pattern:

- **Top** — Month calendar grid (prev/next, dot indicators for event days, click a date to select). Reuse the layout from `AdminEvents.tsx` calendar tab (lines ~180–204).
- **Selected date panel** — list events on the selected day, or "No events" placeholder.
- **This Week section** — show only events whose `event_date` falls in the current week (Mon–Sun). If none → "No Events".
- **Remove the Past section entirely.**
- **Suggest Event** dialog: add an optional `map_url` field (Google Maps URL) — column already exists on `events`. Keep existing title/description/start/end/type/location/overlap-check flow. Owner can still delete their pending submissions.

Calendar styling kept consistent with Admin so the view feels the same for Admin/Tutor/Student.

## Files

**Edit**
- `src/pages/instructor/InstructorAssignments.tsx` — main table columns + detail dialog content
- `src/pages/dashboard/DashboardAssignments.tsx` — card fields + navigate to detail route; extract submit form
- `src/pages/dashboard/DashboardSchedule.tsx` — heading rename + append `LiveClassesBlock`
- `src/pages/dashboard/DashboardEvents.tsx` — full rewrite to calendar layout + week section + map_url field
- `src/App.tsx` — add new student assignment detail route

**New**
- `src/pages/dashboard/DashboardAssignmentDetail.tsx` — dedicated page
- `src/components/assignments/SubmitAssignmentDialog.tsx` — reusable submit pop-up

## Notes / clarifications

- Faculty "Program" comes from `courses.category` (text). When no course is linked, Program shows `—`.
- Student Faculty Name uses the assignment's `instructor_id` → profiles lookup.
- No DB migrations required — `events.map_url`, `assignments.reference_text/video_url/external_link/pdf_url`, `curriculum_topics/modules/batches` all already exist.
