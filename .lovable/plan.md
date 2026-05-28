# Instructor Overview — Phase 11

Rework `src/pages/instructor/InstructorOverview.tsx` so every tile is interactive and the supporting blocks match the requested format. No DB schema changes.

## 1. Stat tiles — clickable + relabeled

Wrap each tile in a button that opens the right destination. Show empty-state friendly counts.

- **Total Students** → opens a dialog with a table of all students across this instructor's batches.
  - Columns: Name, **Registered No.** (from `profiles.enrollment_id`), Semester (current — from `batches.semester` of the latest active batch they're in), Program (from `categories.name` via `batches.program_id`).
  - Project-wide: relabel "Student ID" / "Enrollment ID" → **"Registered No."** in this dialog (other pages untouched in this phase).
- **Upcoming Classes** → rename count to "**today's classes**" (online + offline assigned today to this instructor). Click opens a dialog listing today's classes split into two sections: **Offline first**, then **Online**, each sorted by time.
  - Columns: Title, Mode, Batches, Time, Duration.
  - Source: `live_classes` filtered by `instructor_id` + today's date; `class_type` distinguishes online/offline; batch names resolved via `batches` (handle `audience_type='all'` by listing all instructor batches).
- **Pending Grading** → **rename to "Assignments Ongoing"**. Click navigates to `/dashboard/tutor/assignments`.
- **Active Batches** → **rename to "Assigned Batches"**. Click opens a page-style dialog with all batches assigned, sorted by `semester` ASC (1→4).
  - Columns: Batch Name (clickable → opens nested dialog with batch's students list), Students Count, Program Name, Semester.

Tile gradient/visual styling preserved; only labels, counts, click handlers, and dialogs added.

## 2. My Allocated Subjects

Each subject card becomes a `Link` to `/dashboard/tutor/curriculum` (My Curriculum under My Courses), passing `?module={curriculum_module_id}` so the curriculum view can scroll/select the right subject. Card visuals unchanged.

## 3. Teaching Activity (weekly bar chart)

Replace random data with real query: for the current week (Mon–Sat), sum `class_logs.duration` (fallback `schedules.duration_minutes` / 60) for this instructor per day. Stack a **second bar per day** representing **online hours** (sum of `live_classes.duration_minutes` where `class_type='online'` and `scheduled_at` falls on that day). Render as grouped bars (Teaching vs Online) with a small legend; today still highlighted maroon, others gold/cream.

## 4. Today's Schedule (table format)

Replace the vertical card list with a horizontal table:

```text
| Date / Day      | <slot 1 time>          | <slot 2 time>          | ...
| 25th Apr / Sat  | Theory — Sem 1         | Practical 1 — Sem 3    | ...
```

- First column: date + weekday.
- Header columns: each class's time range (e.g. `9:00am to 9:45am`) sorted ascending.
- Cells: short class label (`{title or type} — Sem {n}`), with mode badge (Online/Offline).
- Source: same `todayClasses` query, plus `schedules` for any offline blocks for today.
- Mobile fallback: stacked cards (existing pattern).

## 5. Recent Submissions

Add an "Unopened" indicator: a red dot + small "New" badge on rows where `assignment_submissions.status='submitted'` AND has not been viewed by the instructor.

- Track viewed state via existing `assignment_submissions` field — use `updated_at`/grade absence as the unopened proxy (`status='submitted'` and no `feedback`/`grade`).
- Header summary line: "X new submissions awaiting review" when count > 0.

## 6. Schedule a Live Class

No changes (per request).

## Technical notes

- New shadcn `<Dialog>` instances colocated inside `InstructorOverview.tsx`; for the Students and Batches tables, extract into small components (`StudentsListDialog`, `BatchesListDialog`, `BatchStudentsDialog`) under `src/components/instructor/` to keep the page lean.
- Queries:
  - Students: `batch_enrollments` for instructor's batches → join `profiles (display_name, enrollment_id)` + `batches (semester, program_id)` → resolve program via `categories`.
  - Today's classes: existing `live_classes` query extended with `class_type`, `audience_type`, and batch resolution (two-step query pattern per project memory).
  - Teaching activity: `class_logs` (date range) + `live_classes` (online slice).
- Routing: `/dashboard/tutor/curriculum` already exists; ensure it reads `?module=` for deep-link selection (small addition in `TutorCurriculum.tsx`).
- All new strings respect Maroon/Gold tokens and 44px touch targets.

## Files

- Edit: `src/pages/instructor/InstructorOverview.tsx`, `src/pages/instructor/TutorCurriculum.tsx` (deep-link param)
- Create: `src/components/instructor/StudentsListDialog.tsx`, `src/components/instructor/TodayClassesDialog.tsx`, `src/components/instructor/BatchesListDialog.tsx`, `src/components/instructor/BatchStudentsDialog.tsx`
