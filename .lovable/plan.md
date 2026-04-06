

## Nada Gurukulam — Document Requirements vs Current State & Implementation Plan

### Document Summary

The uploaded document outlines a comprehensive student management and curriculum tracking system. Below is a gap analysis comparing what's requested vs what's already built, followed by the implementation plan.

---

### What's Already Built (No Changes Needed)

| Requirement | Status |
|---|---|
| Student signup with name, email, password | Done |
| Educator signup with name, email, password | Done |
| Admin created by Super Admin (role management) | Done — AdminStudents role change |
| Course data entry (name, subject, units, topics, hours) | Done — curriculum_modules + curriculum_sections |
| Super Admin approval before publishing | Done — content_reviews workflow |
| Assignments by educator (name, description, course, due date, PDF upload) | Done — InstructorAssignments |
| Student assignment submission + status tracking | Done — DashboardAssignments |
| Certificates page for students | Done (hardcoded demo) |
| Educator analytics (syllabus completion, student counts) | Done — InstructorAnalytics |
| Activity tracking / audit log | Done — AdminActivityLog |
| Curriculum view for students (semester-based) | Done — DashboardCurriculum |

---

### What's Missing — Gaps to Fill

#### Phase 1: Registration Form Enhancements (High Priority)

**1. Educator Registration — add missing fields**
- Contact number
- Employee ID
- Designation

**2. Student Registration — add missing fields**
- Contact number
- Roll No / Registration No
- Course selection (dropdown from database courses)
- Year of course commencement

**3. Admin creation — add missing fields**
- Designation
- Department

**Database**: Add columns to `profiles` table: `employee_id`, `designation`, `department`, `roll_number`, `course_name`, `year_of_commencement`

---

#### Phase 2: Timetable & Schedule System (High Priority)

**4. Dynamic Timetable Management by Admin**

Currently the schedule page is hardcoded demo data. Need:
- Admin can create/edit schedule entries with flexible start/end times per class
- Class duration flexibility (45min, 1hr, or more)
- Fixed institutional timings reference (8:15 AM start, 12:15 PM lunch, 1:30 PM afternoon, 4:00 PM end)
- Assign educator and course/subject to each slot
- Auto-reflect in both educator and student schedule pages

The `schedules` table already exists with `start_time`, `end_time`, `event_title`, `course_id`, `user_id`. Need to:
- Add admin UI for creating timetable entries
- Add `instructor_id` column to schedules table so educators see their own schedule
- Connect student `DashboardSchedule` to real data
- Add schedule view to instructor sidebar

---

#### Phase 3: Class Completion Tracking (High Priority — Core Doc Requirement)

**5. Daily Class Update System**

The document's most critical requirement: after each class, the educator must log what topic was covered. Students confirm it. Both get analytics updated.

- New table: `class_logs` — `id`, `schedule_id`, `instructor_id`, `topic_covered` (from curriculum), `date`, `notes`, `status` (pending_confirmation / confirmed)
- New table: `class_log_confirmations` — student confirmations per class log
- Educator: after class, selects topic from their assigned curriculum → submits
- Student: sees pending confirmations → confirms what was taught
- Analytics: syllabus completion % derived from confirmed class logs vs total topics
- Mismatch detection: if student doesn't confirm, admin sees the gap

---

#### Phase 4: Student Dashboard Fixes (Medium Priority)

**6. My Courses — connect to real data**

Currently uses hardcoded demo array. Need to:
- Fetch from `enrollments` + `courses` tables
- Show subjects for current semester
- Show completion status, instructor, remaining hours

**7. Schedule — connect to real data**

Currently hardcoded. Connect to `schedules` table filtered by student's enrolled courses.

**8. Certificates — connect to real data + upload**

Currently hardcoded. Need:
- Fetch from `certificates` table
- Allow students to upload external certificates (scan/upload feature)
- Storage bucket for certificate uploads

---

#### Phase 5: Student Projects/Presentations (Low Priority)

**9. New "Projects" page for students**

- New table: `student_projects` — `id`, `student_id`, `title`, `description`, `subject`, `file_url`, `created_at`
- Students can create personal projects/presentations beyond assignments
- Visible to educators and admin

---

#### Phase 6: Subject-Teacher Allocation (Medium Priority)

**10. Subject allocation to educators by admin**

- New table: `subject_allocations` — `id`, `instructor_id`, `curriculum_module_id`, `semester`, `academic_year`
- Admin assigns subjects to specific educators
- Educators only see topics from their assigned subjects when logging class completion
- Students see which educator teaches each subject

---

### Implementation Order

```text
Step 1 → DB Migration: Add profile fields + class_logs + 
         class_log_confirmations + student_projects + 
         subject_allocations tables + instructor_id to schedules

Step 2 → Registration forms: Add new fields to student 
         and educator signup

Step 3 → Admin timetable: Build schedule creation UI 
         for admin, connect student/educator schedule 
         pages to real data

Step 4 → Class completion tracking: Educator topic 
         logging + student confirmation + analytics

Step 5 → Student dashboard: Connect My Courses, 
         Schedule, Certificates to real DB data

Step 6 → Student projects page: New page + CRUD

Step 7 → Subject allocation: Admin assigns subjects 
         to educators
```

### Files to Create/Edit

| Action | File |
|---|---|
| **DB Migration** | New migration — 6 profile columns, 3 new tables, 1 altered table |
| Edit | `src/pages/Register.tsx` — add role-specific fields |
| Edit | `src/pages/dashboard/DashboardCourses.tsx` — replace hardcoded with real data |
| Edit | `src/pages/dashboard/DashboardSchedule.tsx` — replace hardcoded with real data |
| Edit | `src/pages/dashboard/DashboardCertificates.tsx` — real data + upload |
| Create | `src/pages/dashboard/DashboardProjects.tsx` — student projects CRUD |
| Create | `src/pages/admin/AdminSchedule.tsx` — timetable management |
| Create | `src/pages/instructor/InstructorClassLog.tsx` — daily class update |
| Create | `src/pages/dashboard/DashboardClassLog.tsx` — student confirmation |
| Edit | `src/components/DashboardSidebar.tsx` — add new nav items |
| Edit | `src/App.tsx` — add new routes |
| Edit | `src/pages/admin/AdminStudents.tsx` — subject allocation UI |
| Edit | `src/pages/instructor/InstructorAnalytics.tsx` — syllabus completion from class logs |

### Technical Notes

- All new tables will have proper RLS policies
- Class log system uses curriculum topics as the source of truth for syllabus tracking
- Certificate upload uses a new `student-certificates` storage bucket
- Registration fields stored in profiles (not auth.users) for easy querying
- The document mentions temp passwords + OTP — this requires custom auth flow and will be noted as a future enhancement

