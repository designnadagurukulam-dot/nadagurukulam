# Phase 14 — Instructor Live Classes, Assignments, Schedule & Events

## 1. Live Classes (`TutorLiveClasses.tsx`)

- **Tabs become two**: `Online (Upcoming)` and `Past`.
- **Remove** the entire `Offline` tab and its `upcomingOffline` rendering. Drop the `offlineSchedules` query — offline schedules now live on the Schedule page.
- **Past tab**: filter to online-only — `classes.filter(c => isLiveClassPast(c) && (c.class_type === "online" || !c.class_type))`. No offline rows.
- Create-class dialog: keep as-is (online only).

## 2. Assignments (`InstructorAssignments.tsx`)

### Create form — add fields
- Title (existing)
- **Course** — dropdown of instructor courses + an `N/A` option (stores `course_id = null`)
- **Module** — dropdown of `curriculum_modules` for the chosen course's program/semester (or all instructor-allocated modules when course is N/A) + `N/A`
- **Topic** — dropdown of `curriculum_topics` for the chosen module + `N/A`
- **Batch** — dropdown of instructor batches (required)
- Description / Instructions (existing)
- Due Date & Time (existing)
- Reference: Video URL, External Link, PDF upload, **plus** a "Text reference" textarea (existing video/link/PDF retained)

### DB migration
Add nullable columns to `assignments`:
- `curriculum_module_id uuid`
- `curriculum_topic_id uuid`
- `reference_text text`
Make `course_id` nullable (currently `NOT NULL`) to support N/A. Keep existing RLS unchanged.

### List view — replace card list with a table
Columns: **Title | Course | Module | Topic | Batch | Due Date | Actions**. Cell values fall back to "—" when N/A. Row click still toggles the Submissions tab for that row. Keep mobile fallback as stacked cards.

## 3. Schedule tab (`DashboardSchedule.tsx`, instructor view)

The Schedule sidebar entry already exists. Extend the instructor variant so it has two stacked sections:

### A. Weekly Timetable (top, existing)
- Keep the current week view of `schedules` filtered by `instructor_id = auth.uid()`.
- Add **"Add Schedule"** button (instructor) that inserts a one-off `schedules` row (`schedule_type = 'extra'`, instructor_id = self). Required fields: title, date, start time, end time, batch (optional), location (optional). On save, refetches both timetable and Teaching Log topic dropdown for the affected day.

### B. Teaching Log (below timetable, replaces standalone Class Log)
Header strip: **Name of the Faculty** (from profile) · **Designation** (from profile metadata).

Table columns: **S.No | Date | Day | Time | Batch & Sem | Topic | T | Th | P | Remarks**

Behavior:
- One row per period on the active week's schedule (auto-generated from `schedules` rows for the instructor).
- **Topic**: dropdown populated from the topics this instructor added in the **Lesson Plan** for that course/module (i.e. `lesson_plan_entries.topic_title` / `curriculum_section_id`). Each lesson-plan topic may be selected only up to its planned period count (e.g. 5 periods → choosable 5 times across the log).
- **T / Th / P columns**: auto-filled from a new `curriculum_sections.session_type` field (`Tutorial | Theory | Practical`); a single tick appears under the matching column. Read-only.
- **Remarks**: editable textarea.
- **Editing rules**: rows for the **current week** are editable. Past weeks are read-only. A week selector lets the user navigate any week of the academic year for viewing/downloading.
- **Download PDF** button per displayed week — generates the Teaching Log as a landscape PDF (same brand styling as Lesson Plan PDF). Available for all past weeks too.
- **Save row** writes to `class_logs` (existing table) with `schedule_id`, `curriculum_section_id`, `topic_covered`, `date`, `notes` (Remarks), `status = 'pending_confirmation'`. Existing realtime notification + `class_log_confirmations` flow continues to fire so students get notified and analytics update.
- Remove the standalone `/dashboard/tutor/class-log` sidebar entry (it is currently not in the sidebar; the route stays for backward compatibility but the page is no longer linked — log entry happens here).

### DB migration
- `curriculum_sections.session_type text` — values `'Tutorial' | 'Theory' | 'Practical'` (nullable, defaults `'Theory'`). Surface this as a select in `AdminCurriculum.tsx` and `TutorCurriculum.tsx` section editor.

## 4. Events tab (`DashboardEvents.tsx`)

- Replace stacked card layout with a **month calendar view** (same component pattern as `AdminEvents.tsx` super-admin view) — date cells show colored dots per event.
- Clicking a date shows that day's events below the calendar, or "No events" placeholder.
- Below the day strip, render an **"This Week's Events"** list (current Mon–Sun). If empty → "No Events". **Hide all past events.**
- Same view applies to student, instructor, and admin role variants (single component).
- **Suggest Event** dialog (existing): add an optional **Google Maps URL** field (`events.map_url` already exists), plus existing location text.

## Files Touched

- `supabase/migrations/<new>.sql` — three columns (assignments: 3 cols + nullable course_id; curriculum_sections: session_type)
- `src/pages/instructor/TutorLiveClasses.tsx` — remove Offline tab, past = online only
- `src/pages/instructor/InstructorAssignments.tsx` — expanded create form + table list
- `src/pages/dashboard/DashboardSchedule.tsx` — instructor branch gets Add-Schedule + Teaching Log table & week navigator
- `src/lib/teachingLogPdf.ts` (new) — landscape PDF generator
- `src/pages/dashboard/DashboardEvents.tsx` — calendar layout + map URL field
- `src/pages/admin/AdminCurriculum.tsx`, `src/pages/instructor/TutorCurriculum.tsx` — session_type select
- `src/integrations/supabase/types.ts` — regenerated

## Out of Scope

- Reworking Super Admin AdminLessonPlans / AdminLiveClasses (only the instructor side here).
- Auto-generating recurring `schedules` rows from lesson plans (timetable still seeded by admin; instructor's "Add Schedule" creates one-offs only).
- Forcing weekly submission gating (PDF download is provided; no hard lock on Saturday).
