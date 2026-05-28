# Phase 19 — Student dashboard polish + Analytics

## 1. Reach Out (chat)

Attachment + voice note already exist in `ChatComposer` (Paperclip, Mic). No changes there.

Contact-list scope changes:

- `src/pages/dashboard/StudentChat.tsx` — fetch all verified faculty by name. Today it already lists `instructor` + `admin`. Keep that, but note: students must **not** see other students. Already the case. Add a section header "Faculty" so it's clear all faculty are listed. (Search already covers all of them.)
- `src/pages/instructor/TutorMessages.tsx` — broaden contacts so faculty see **all students** (not just their batch students) **and all other faculty**. Group the contact list into two sections: "Students" and "Faculty", with search across both. Exclude self.
- Students remain blocked from messaging other students (no UI exposes it; RLS already restricts).

## 2. Feedback wording

`src/pages/dashboard/StudentFeedback.tsx`:
- Line 226: replace privacy note text with just `This feedback is completely anonymous.` (remove "Only the admin team can read it.")
- Line 245: change history heading from `Your Feedback History & Admin Replies` to `Your Feedback History`.

## 3. Certificates

No changes.

## 4. Analytics tab for Students (new)

Sidebar: add `{ label: "Analytics", to: "/dashboard/student/analytics", icon: BarChart3 }` to `studentNav` (above Profile).

Route: add `/dashboard/student/analytics` in `src/App.tsx` guarded for `student`.

New page `src/pages/dashboard/DashboardAnalytics.tsx` with two charts (Recharts, already used by Admin/Instructor analytics):

- **Course completion** — for each enrolled course (from `batch_enrollments` → `batches` → `courses`):
  - Top-level progress bar/donut: % topics completed across the course.
  - Drill-down (accordion or tabs per course): module-wise stacked bar (Completed vs Pending topics per module) and topic-wise checklist colored by status.
  - Completion source: `class_logs` confirmed by the student (existing `class_log_confirmations` table) joined to `topics` → `chapters` → `subjects` → `courses`.
- **Assignments completion** — bar/donut showing Submitted / Pending / Graded / Overdue counts from `assignments` filtered by the student's batches, joined to `assignment_submissions` for the user.

Empty-state copy: "Once your courses and assignments have activity, analytics will populate here."

UI: brand cards, responsive grid (1 col mobile, 2 col desktop), matches existing `InstructorAnalytics.tsx` styling.

## 5. Profile

No changes.

## Files

Edit: `StudentChat.tsx`, `TutorMessages.tsx`, `StudentFeedback.tsx`, `DashboardSidebar.tsx`, `App.tsx`.
Create: `src/pages/dashboard/DashboardAnalytics.tsx`.
No DB migrations.
