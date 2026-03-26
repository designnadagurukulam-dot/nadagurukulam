

## Assignments System — Educator Creates, Student Submits

### Overview

Replace the instructor "Submissions" tab with a full "Assignments" tab. Educators create assignments (with optional PDF attachments) for their courses. Students see these assignments and can upload submission files. Educators can view all student submissions per assignment.

### Database Changes

**New table: `assignment_submissions`**

```text
assignment_submissions
├── id (uuid PK)
├── assignment_id (uuid FK → assignments)
├── student_id (uuid, references auth.users)
├── file_url (text, nullable) — uploaded PDF/file
├── text_content (text, nullable) — optional text submission
├── status (text: 'submitted' | 'graded' | 'late') default 'submitted'
├── grade (text, nullable)
├── feedback (text, nullable)
├── submitted_at (timestamptz, default now())
├── updated_at (timestamptz, default now())
```

**Modify existing `assignments` table:**
- Add `instructor_id` (uuid, nullable) — who created it
- Add `pdf_url` (text, nullable) — assignment PDF attachment

**Storage bucket:** `assignment-files` (public: false) for both assignment PDFs and student submission uploads.

**RLS policies on `assignment_submissions`:**
- Students can INSERT/UPDATE/SELECT their own submissions
- Instructors can SELECT submissions for their course assignments
- Admins can SELECT all

**Update RLS on `assignments`:**
- Instructors can INSERT/UPDATE/DELETE assignments for their own courses
- Students can SELECT assignments for enrolled courses (already exists)

### Educator Side — Replace InstructorSubmissions

**Rename route:** `/dashboard/instructor/submissions` → `/dashboard/instructor/assignments`

**New `InstructorAssignments.tsx`:**
- Lists all assignments created by this instructor (fetched via `assignments` joined with `courses` where `instructor_id = auth.uid()`)
- "Create Assignment" button opens dialog: title, description, select course (from instructor's courses), due date, optional PDF upload
- Click an assignment → expands/navigates to show student submissions list
- Each submission shows: student name, submitted date, file download link, status, and option to add grade/feedback

### Student Side — Update DashboardAssignments

**Rewrite `DashboardAssignments.tsx`:**
- Fetch real assignments from DB (joined via enrollments to get only assignments for enrolled courses)
- Each assignment card shows: title, course name, due date, status, attached PDF download
- "Submit" button opens dialog: upload file + optional text content
- Shows submission status if already submitted (submitted, graded, late)
- Display grade/feedback if graded

### Sidebar Change

- Instructor nav: Change "Submissions" label to "Assignments", route to `/dashboard/instructor/assignments`

### Files to Create/Edit

- **Migration SQL**: Add `assignment_submissions` table, alter `assignments` table, create storage bucket, RLS policies
- **Create**: `src/pages/instructor/InstructorAssignments.tsx`
- **Rewrite**: `src/pages/dashboard/DashboardAssignments.tsx`
- **Edit**: `src/components/DashboardSidebar.tsx` — rename Submissions → Assignments
- **Edit**: `src/App.tsx` — update route, swap component import
- **Delete/deprecate**: `src/pages/instructor/InstructorSubmissions.tsx` (no longer used)

