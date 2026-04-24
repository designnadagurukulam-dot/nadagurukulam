

# Admin Dashboard Refinement — Comprehensive Plan

This plan covers all the changes you requested across the Admin section. It's grouped by tab so you can track progress easily.

---

## 1) Overview tab (`AdminOverview.tsx`)

- Make every stat block a clickable card that navigates to its respective page (Students, Teachers, Courses, Batches, etc.).
- Remove the **Revenue** block entirely.
- Quick Action notification bubbles will only show **unread / pending** counts (no totals). E.g. only unread messages, only pending verifications, only ungraded submissions, only pending inquiries.
- Remove the **Recent Courses** and **Recent Activities** sections from this page.

---

## 2) Verification tab (`AdminUserVerification.tsx`)

- Move the **Role selector** inline into the **Role column** of the table.
- Remove the separate role dropdown next to the Approve/Revoke buttons.
- Action column will only contain Approve/Revoke buttons.

---

## 3) Users tab (`AdminStudents.tsx`)

- Default role filter changes from "Student" to **All Users**.
- Table columns redesigned to show:
  - Name
  - User type (Student / Instructor / Admin)
  - Verification status (Verified / Pending)
  - Date joined
  - Roll No / Employee ID / Enrollment ID
  - Context column:
    - Students → Batch name
    - Instructors → Program (Carnatic Vocal, Tabla, etc.)
    - Admins → Custom admin label (e.g. "Academic Admin", "Operations Admin")
- Remove batch/link assignment controls from this page (those belong in Batches/Subject Allocation).
- Only allow changing **user type** here.
- Hide **Srinivas V (Super Admin)** from the list — only show super admins if more than one exists.
- Add a small admin-label field stored on the profile so you can name each admin's role purpose.

---

## 4) Teachers tab → renamed to **Subject Allocation** (`AdminTeachers.tsx` / `AdminSubjectAllocation.tsx`)

- Rename tab and route label from "Teachers" to **Subject Allocation**.
- Top tile **"Teachers"** with count → clicking opens a list of teachers.
- Filter pill **"All Departments" → "All Programs"** populated dynamically from the live programs list (Carnatic Vocal, Hindustani Vocal, Bharatanatyam, etc.). Designations also pulled dynamically.
- Per-course detail will show **other instructors assigned to the same course in the same semester**, so you can balance allocations.
- Add a **duplicate-name guard**: prevent saving a course if the same course name already exists (case-insensitive). Existing duplicates flagged with a warning indicator.
- Rename **"Assigned Subjects"** tile → **"Programs"**, click navigates to Curriculum page.
- Rename **"Linked Batches"** tile → **"Batches"**, click navigates to Batches page.
- Keep the **Assign Batch** action.

---

## 5) Batches tab (`AdminBatches.tsx`)

Tile order at the top:
1. **Students** (total student count)
2. **Total Batches**
3. **Active Batches**
4. **Past Batches** (batches whose end date has passed / course completed)

Manage Batch dialog tabs:
- Students list (existing) ✓
- Subjects (auto-populated from subject allocation)
- Timetable (auto-populated from schedule once subjects are linked)
- Live (label clarification needed — see question below)
- Assignments → split into **Past** and **In Progress**
- New **Grades** tab showing per-student CIE / SEE grades alongside assignment grades, so you see overall academic standing per batch.

(Backend: a small grades table — `student_grades` — with CIE and SEE marks per student per subject per batch.)

---

## 6) Curriculum tab (`AdminCurriculum.tsx`)

Hierarchy changes from:
`Semester → Course → Module → Content`
to:
`Semester → Course → Module → Topics → Materials`

- Add **Add Course** action (renamed from "Add Curriculum").
- Inside each Semester: **Add / Edit Courses**.
- Inside each Course: **Add / Edit Modules**.
- Inside each Module: **Add / Edit Topics**.
- Inside each Topic: **Add / Edit Materials** (PDF, audio, video, text).
- Course list view: each course shown as a wide tile with **Course Code**, **Assigned Tutor(s)**, **Batches assigned**. Clicking opens the existing detailed view.
- Video materials displayed as small **YouTube-style thumbnail tiles**.

(Backend: a new `curriculum_topics` table inserted between modules and materials. Existing curriculum sections will be migrated under auto-created default topics so nothing is lost.)

---

## 7) Lesson Plans tab

- No structural changes yet — you'll review after seeing tutor-side flow.
- I'll only fix obvious bugs in this pass.

---

## 8) Live Classes tab (`AdminLiveClasses.tsx`)

Tiles, in order:
1. **Tutors** — list of all staff (permanent + guest). Clicking a tutor opens a panel showing:
   - Name, ID No., Designation, Courses allocated
   - Inputs for **Zoom link** and **Google Meet link** (saved per tutor)
   - If links missing → tutor sees a "Contact Admin to create your meeting link" notification
2. **Total Classes**
3. **Online Today** (date-specific — only today's online classes)
4. **Total Online Classes (all-time)**
5. **Total Online Hours (all-time)**

- Remove offline classes from this page entirely (they live in Schedule).
- Remove the generic "Online" tile in favour of **Online Today**.

---

## 9) Assignments tab (`AdminAssignments.tsx`)

- Add a new tile: **Assignments In Progress** (open assignments past-creation but before due date).
- Keep current overall design.
- Convert each row to a **toggle/expandable row**: clicking the assignment name opens a detail panel showing:
  - Course / Topic (or "Other" if standalone)
  - Tutor name
  - Date created
  - Due date
  - Date submitted (per student)
  - Status
  - Grade

---

## Database changes required

1. New table `curriculum_topics` (between modules and sections).
2. New table `student_grades` (CIE / SEE per student per subject per batch).
3. New columns on `profiles`:
   - `admin_label` (text) — custom admin role name
   - Existing `zoom_link` / `meet_link` already exist for tutors ✓
4. New unique index on `courses.title` (case-insensitive) to prevent duplicates.
5. Light data migration to move existing `curriculum_sections` under default auto-created topics.

No destructive changes — all existing data preserved.

---

## Files that will be edited

- `src/pages/admin/AdminOverview.tsx`
- `src/pages/admin/AdminUserVerification.tsx`
- `src/pages/admin/AdminStudents.tsx`
- `src/pages/admin/AdminTeachers.tsx` (rename label to Subject Allocation)
- `src/pages/admin/AdminBatches.tsx`
- `src/pages/admin/AdminCurriculum.tsx`
- `src/pages/admin/AdminLiveClasses.tsx`
- `src/pages/admin/AdminAssignments.tsx`
- `src/components/DashboardSidebar.tsx` (relabel Teachers → Subject Allocation, badge counts)
- `src/integrations/supabase/types.ts` (auto-regenerated)

---

## Implementation order

1. Database migrations (topics, grades, admin_label, duplicate guard)
2. Overview cleanup
3. Users + Verification refinements
4. Teachers → Subject Allocation rename + tiles
5. Batches tiles + Grades tab
6. Curriculum hierarchy (Semester → Course → Module → Topic → Materials)
7. Live Classes restructure + tutor links
8. Assignments expandable rows + new tile
9. Build validation

---

## One open question before I start

For the Batches **"Live" tab** inside Manage Batch — you asked what its main use should be. My suggestion: show **upcoming + recent live classes scheduled for that batch** (next 7 days + last 7 days), with quick join links and attendance status. If you'd prefer something else (e.g. live recording library, or remove it entirely), tell me when you approve and I'll adjust.

