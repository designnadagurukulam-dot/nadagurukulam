
## Scope (all in one build)

Programs reuse the existing link: `courses.program_id → categories(id)`. I'll extend `batches` and `curriculum_modules` to also reference `categories(id)` as their program, so all three (Batches, Curriculum, Courses) share the same Program list. "1 credit = 15 hours = 20 periods" — both auto-derived, editable only by Super Admin (Admin sees read-only). Active vs Past batches are computed live from `start_date/end_date` (no cron).

---

## 1. Quick fixes

**Gallery (`src/pages/Gallery.tsx`):** Audit for the reported glitches — replace layout-shift causing `motion` props, lock image aspect ratios, remove flicker from filter switching (use shared layout with `staggerChildren`, no `AnimatePresence mode="wait"`), preload images, fix lightbox z-index/scroll-lock.

**Faculty detail (`src/pages/FacultyDetail.tsx`):** Remove "bubble" Badge wrappers on *Specialities* and *Awards & Recognitions*; render as plain list items with full-opacity foreground text (drop `text-muted-foreground`/opacity classes).

---

## 2. Batches restructure (`src/pages/admin/AdminBatches.tsx` + new pages)

### 2a. Schema (migration)
- `ALTER TABLE batches ADD COLUMN program_id uuid REFERENCES categories(id), ADD COLUMN semester integer, ADD COLUMN is_manually_active boolean DEFAULT true`.
- `ALTER TABLE curriculum_modules ADD COLUMN program_id uuid REFERENCES categories(id)`.
- Backfill `batches.program_id` from `courses.program_id` via `batches.course_id` where possible.

### 2b. New navigation hierarchy
Replace current `AdminBatches` landing with **Program tiles** (clickable cards, one per category used as a program). Stat tiles on top — remove "Students" tile, keep only **Total / Active / Past**, all clickable.

- `/dashboard/admin/batches` → Program tiles + 3 stat tiles
- `/dashboard/admin/batches/program/:programId` → Semester accordions listing batches in that semester
- `/dashboard/admin/batches/active` → table view (see 2c)
- `/dashboard/admin/batches/past` → table view (see 2d)
- `/dashboard/admin/batches/:batchId` → existing single-batch detail (current "Manage Batch" content, see §3)
- `/dashboard/admin/batches/:batchId/students` → table of enrolled students

### 2c. Active batches table
Columns: Name (clickable → batch detail), Semester, Program, Duration (live "X days remaining" based on end_date), Students count (clickable → students table: name, enrollment_id, program, joined date), Courses linked (derived from curriculum_modules where `program_id` matches AND `semester` matches), Tutors. Sorted by semester ASC. Active = `is_manually_active AND (end_date IS NULL OR end_date >= today)`.

### 2d. Past batches table
Past = `end_date < today OR is_manually_active = false`. Sorted by `end_date DESC`. Columns: Name, Program, Duration, Students (clickable). 

### 2e. Active/Past toggle on each batch
Add a switch on batch detail header that flips `is_manually_active` (lets admin force-archive or revive a batch independent of dates).

---

## 3. Manage Batch detail tweaks (`AdminBatches.tsx` detail view)

- **Students:** Allow deselect — multi-select with chips that have ✕, plus an "Edit students" mode on the existing roster to remove students (DELETE from `batch_enrollments`).
- **Subjects:** Add Add/Edit/Delete buttons directly inside Manage Batch (writes to `curriculum_modules` filtered by `batch_id`).
- **Live tab:** Show only `class_type='online'` live classes; class names link to `/dashboard/admin/live-classes`. Offline classes removed from here — they appear only in Timetable.
- **Timetable tab:** Read-only (remove edit/delete buttons; keep "view schedule" UI).
- **Assignments tab:** Sort In-progress first (due_date >= today), then Past (due_date < today), each group sorted by due_date.
- **Grades tab:** Show only assignments where at least one `assignment_submissions.grade IS NOT NULL`; otherwise show empty state "Grades will appear here once you grade submissions."

---

## 4. Curriculum overhaul (`src/pages/admin/AdminCurriculum.tsx`)

### 4a. Programs CRUD on the curriculum landing
Landing shows **Program tiles** (same categories list as Batches). Top toolbar: Add Program / Edit / Delete (writes to `categories`). Clicking a tile → `/dashboard/admin/curriculum/:programId`.

### 4b. Program detail page (replaces current curriculum view)
- Program name as centered top heading.
- Semester sections; heading reads "Semester 1" only (no "Courses" suffix). Courses inside become collapsible toggles.
- Edit button on each course banner (inline pencil) opens the full course edit dialog.
- Course banner shows: course name, code, instructor(s), **assigned batch**.

### 4c. Course form — full academic fields
Replace existing course dialog with all of:
- Program (dropdown from categories) — required
- Course name, Course code
- Semester (dropdown 1–N based on program's `total_semesters` — add `total_semesters` int to categories meta; default 8)
- **Credits** (int)
- **Teaching hours** auto = credits × 15; **Periods** auto = credits × 20; both shown; editable input is disabled unless `has_role(uid,'super_admin')` — Admin sees the values but the inputs are `readOnly`.
- Assigned Instructor (dropdown of all staff + "To be assigned" sentinel = null)
- Assigned Batch (dropdown of batches)
- CIE marks, SEE marks
- Examination type (free text — Theory/Practical/Viva/etc.)
- Exam duration CIE, Exam duration SEE (separate)
- Course Objectives (multi-line list)
- Course Outcomes (array of {co_number, description, rbt_levels, hours} — already exists as `course_outcomes` table)
- Pedagogy

Storage: most fields already on `curriculum_modules`. Add columns: `credits int`, `teaching_hours int`, `periods int`, `exam_type text`, `cie_exam_hours text`, `see_exam_hours text`, `program_id uuid`, `instructor_id uuid`, `batch_id` (exists). Drop unused `exam_hours` consolidation. Clicking a course name shows the same banner with all these fields (not just course code as today).

### 4d. Modules under a course
Each course gets an **Add / Edit / Delete Module** affordance. Module form contains ONLY:
- Module name
- Hours
- Teaching methodology
- RBT levels (multi-select chips)
- Course Outcomes mapped (multi-select dropdown showing "CO1, CO2..." derived from `course_outcomes.co_number` of the parent course — stored as text like "CO1,CO3"). Full CO descriptions are visible only on the Curriculum / course detail page, not in the module form.

Remove the current bleed-through of CIE / objectives / pedagogy into the module dialog.

### 4e. Topics under a module
Full Add / Edit / Delete on every topic (today they aren't editable — fix). Fields:
- Topic name
- Description (optional)
- Attachments: YouTube links, files (PDF/Word/Excel/any — upload to `curriculum-materials` bucket), notes/text body. Multiple per topic via `curriculum_section_links` (already exists) + `curriculum_sections.text_content`.

---

## Technical notes

- New migration adds columns to `batches`, `curriculum_modules`, `categories` (add `total_semesters int default 8`); backfills `program_id`. Includes GRANTs already in place (no new tables).
- Role enforcement for teaching-hours edit: use `has_role(auth.uid(),'super_admin')` via `useAuth` hook (`isSuperAdmin`) to set the input `disabled` prop.
- All new admin routes registered in `src/App.tsx` under `RoleProtectedRoute` for admin/super_admin.
- New shared components: `<ProgramTiles />`, `<BatchTable mode="active|past" />`, `<StudentsRosterTable />`, `<CourseFormDialog />`, `<ModuleFormDialog />`, `<TopicFormDialog />`.

### Files touched
- Migration (1)
- `src/pages/Gallery.tsx`, `src/pages/FacultyDetail.tsx`
- `src/pages/admin/AdminBatches.tsx` (rewrite landing + detail tweaks) + 4 new sub-pages
- `src/pages/admin/AdminCurriculum.tsx` (rewrite) + new program-detail page
- `src/App.tsx` (routes)
- New components under `src/components/admin/`

### Out of scope (flag if needed)
- Auto-rotating *current semester* of a batch over time as the program progresses (you mentioned "automatically update courses as semesters change"). I'll wire the view to derive courses from `program_id + current_semester`, where `current_semester` defaults to the batch's stored semester. True calendar-driven semester progression (e.g. semester 1 → 2 after 6 months) would need a separate "semester duration" config — confirm if you want that now.
