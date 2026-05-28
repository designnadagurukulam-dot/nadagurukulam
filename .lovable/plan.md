## Phase 10 — Feedback, Timetable, Jobs

### 1. Feedback tab (`AdminFeedback.tsx`)

**Collapsible feedback cards.** Each feedback becomes a toggle block:
- **Collapsed state shows:** student name + avatar, "Feedback on: <instructor / general>", submitted date, and overall average star rating across that submission's categories, plus a reply count badge. Chevron indicates expand/collapse.
- **Expanded state shows:** per-category breakdown — category name, stars, and that category's free-text comment inline (currently comments are hidden). The general/legacy `message` field is shown beneath. Existing Reply thread + reply composer stays.

**Rating filter cleanup.**
- Delete the "5 star rating" option entirely.
- Rename "Above 4 star rating" → **"4 star and above"** with filter logic `rating >= 4`.
- Keep 1/2/3 star exact-match options and "All Ratings".

**Average Rating tile becomes clickable.** Clicking the 3.9 tile opens a popup showing:
- **Average per category** (sorted high→low) with star bar + numeric value + sample count.
- **Per-instructor average** (top 5) with sample count.
- **Total submissions, total raters (unique students), median rating, % feedback ≥4 stars.**

**Remove Rating Distribution tile** entirely (the third summary tile and `RATING_COLORS`/`ratingDistribution` memo + recharts import).

### 2. Timetable tab

**Schedule grid restructure (`AdminSchedule.tsx`).**
- Pivot the table: **days on the left axis (rows)**, **time slots on the top axis (columns)**. Time columns are derived dynamically from the union of all scheduled start hours that week (so columns adapt to what's actually scheduled — e.g. 8 AM, 10 AM, 2 PM only) with a base set of fallback hours when empty.
- Each tile shows **Title · Semester · Instructor · Batch** (currently only title + instructor/location).
- Add a **Timeline view** toggle (Grid / Timeline). Timeline = one row per active hour for the day, with overlapping classes stacked side-by-side so a super admin can see logistics/space load at a glance. Each timeline block carries the same 4-line metadata.

**Add Schedule dialog.**
- Rename **"Subject"** label → **"Subject / Course"**.
- Course/Subject dropdown filtered to **only modules whose `batch_id === form.batchId`** (currently still shows modules with null batch_id as a fallback). Disable the subject select until a batch is picked, with helper text.
- **Hard overlap rule:** if a batch has any schedule overlapping the chosen time, block adding a new entry for the **same batch** OR **same instructor**. Today's logic offers an "Override" option for collisions; tighten it so batch + instructor collisions in the same time window are **rejected outright** with a clear message (instructors and batches must be free). Subject-level overlaps stay as a soft warning that allows override.
- "Title (optional override)" stays.

**Schedule tab for instructors & students.**
- Add sidebar entry in `DashboardSidebar.tsx` pointing to `/dashboard/tutor/schedule` (instructors) and `/dashboard/student/schedule` (students). Routes already exist.
- Rework `DashboardSchedule.tsx` into a **weekly view** (Mon–Sun, current week with prev/next):
  - **Instructor view:** schedules where `instructor_id = auth.uid()` for the current week.
  - **Student view:** schedules where `batch_id IN (SELECT batch_id FROM batch_enrollments WHERE student_id = auth.uid())` for the current week.
  - Tiles show Title · Time · Instructor · Batch · Room — same compact card style.

### 3. Jobs tab (`AdminJobs.tsx`)

- Rename **"Department"** label and column → **"Program"** throughout (UI strings only; DB column `department` stays).
- "Manage Departments" button → **"Manage Programs"**.
- Program dropdown is sourced from the **curriculum programs** (`categories` table where `parent_id IS NULL` — the same programs used in the curriculum tree), **plus** any custom programs you've added via `job_departments`. Both lists are merged and de-duplicated by name. The "Manage Programs" dialog lets you add extra non-curriculum roles (e.g. "Operations", "Communications") which keep flowing into `job_departments`.

### Files
- **Edit:** `src/pages/admin/AdminFeedback.tsx`, `src/pages/admin/AdminSchedule.tsx`, `src/pages/admin/AdminJobs.tsx`, `src/pages/dashboard/DashboardSchedule.tsx`, `src/components/DashboardSidebar.tsx`.

No DB migrations needed — all data is already in `feedback`, `schedules`, `batch_enrollments`, `categories`, `job_departments`.
