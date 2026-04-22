
# Nada Gurukulam LMS — Brand, Curriculum, Lesson Plan, Admin UX Implementation Plan

## Important schema adjustment
The prompt references `subjects` and `topics`, but this project currently uses the existing curriculum model:

- `curriculum_modules` = subject/module/paper structure
- `curriculum_sections` = topic/section rows
- `subject_allocations` = tutor-to-curriculum assignment

To avoid breaking the existing LMS, I will implement the requested curriculum and lesson-plan feature on top of the current tables instead of creating a parallel incompatible `subjects/topics` system.

---

## 1. Official Brand Correction

### Update global theme
Modify:

- `src/index.css`
- `tailwind.config.ts`
- shared UI card/input styling where needed

Changes:

- Replace current Cormorant/Nunito brand import with official fonts:
  - Jost for display/headings
  - EB Garamond for serif body/card/curriculum text
  - Cabin for nav/forms/tables/buttons/body
- Replace global CSS variables with the official palette:
  - Deep maroon `#470500`
  - Primary maroon `#7e2320`
  - Ganges Gold `#E0AC27`
  - Cream `#FFFDE9`
  - Sand/ochre support colors
- Update Tailwind `brand.*` colors to match official tokens.
- Apply strict typography scale through reusable utility classes:
  - Body: 16px / 26px
  - Subheading: 20px / 28px
  - Heading: 24px / 34px
  - Display: 32px / 44px

### Remove card borders globally
Modify:

- `src/components/ui/card.tsx`
- common page card classes across admin/tutor/student/public pages where practical
- input/table/card styling utilities in `src/index.css`

Changes:

- Remove card outline borders and replace with:
  - `box-shadow: 0 2px 16px rgba(71,5,0,0.06)`
- Keep table row divider lines only.
- Change input fields toward bottom-border styling instead of boxed borders.
- Keep accessible focus rings.

### Sidebar wave element
Modify:

- `src/components/DashboardSidebar.tsx`

Changes:

- Add official wave SVG/shape at the bottom of sidebar above user/action area.
- Update sidebar typography to Jost/Cabin.
- Remove border-heavy dividers where possible and replace with spacing/shadows.

---

## 2. Backend Schema Migration

Create a new migration adapted to the existing schema.

### Enhance curriculum modules and sections
Instead of `subjects`, add subject-level fields to `curriculum_modules`:

- `course_objectives text[]`
- `pedagogy text`
- `assessment_cie_marks integer default 20`
- `assessment_see_marks integer default 30`
- `exam_hours text`
- `references_list text[]`

Instead of `topics`, add topic-level fields to `curriculum_sections`:

- `rbt_levels text`
- `co_mapping text`
- `hours_allocated integer default 1`
- `teaching_methodology text`

### Add course outcomes
Create:

- `course_outcomes`
  - `id`
  - `curriculum_module_id`
  - `co_number`
  - `description`
  - `rbt_levels`
  - `hours`
  - `sort_order`
  - timestamps

RLS:

- Authenticated users can view outcomes.
- Admin/super admin can manage outcomes.
- Instructors can view outcomes for assigned modules.

### Add lesson plans
Create:

- `lesson_plans`
  - `id`
  - `curriculum_module_id`
  - `instructor_id`
  - `academic_semester`
  - `section`
  - `contact_hours_per_week`
  - `total_periods`
  - `is_published`
  - timestamps
  - unique module/instructor/semester combination

- `lesson_plan_entries`
  - `id`
  - `lesson_plan_id`
  - `lecture_number`
  - `module_number`
  - `curriculum_section_id`
  - `topic_title`
  - `rbt_level`
  - `co_mapping`
  - `actual_date`
  - `faculty_remarks`
  - `sort_order`

RLS:

- Tutors manage their own lesson plans.
- Admin/super admin can view and manage all lesson plans.

### Enhance schedules
Add missing timetable fields to `schedules`:

- `schedule_type text default 'offline'`
- `paper_code text`
- `batch_id uuid`
- `curriculum_module_id uuid`
- `location text`
- `recurrence_type text default 'one_time'`

### Enhance events
Add optional event classification:

- `event_type text default 'cultural'`

This supports colored dots on public/admin calendars.

---

## 3. Curriculum UI Enhancement

Modify:

- `src/pages/admin/AdminCurriculum.tsx`
- `src/pages/instructor/TutorCurriculum.tsx` where topic metadata is entered

Changes:

- Add Course Outcomes panel under each subject/module group.
- Admin can add/edit/delete CO rows:
  - CO number
  - description
  - RBT levels
  - hours
- Add official academic fields to subject/module edit UI:
  - objectives
  - pedagogy
  - CIE/SEE marks
  - exam hours
  - references
- Add RBT, CO mapping, hours, and methodology fields when creating/editing curriculum sections.
- Use dropdown-based CO selection where possible to keep mappings consistent.

---

## 4. Lesson Plan System

### New tutor page
Create:

- `src/pages/instructor/TutorLessonPlans.tsx`

Route:

- `/dashboard/tutor/lesson-plans`

Sidebar:

- Add “Lesson Plans” to tutor dashboard.

Features:

- List assigned subjects from `subject_allocations`.
- Show cards with:
  - Subject name
  - Course code
  - Semester
  - completion percentage
  - “Edit Lesson Plan”
  - “Download PDF”
- Edit view:
  - header with subject, department, semester, teacher
  - read-only module summary
  - 60-row lecture log by default
  - topic dropdown populated from `curriculum_sections`
  - module auto-filled from selected topic
  - RBT auto-filled but editable
  - CO mapping auto-filled and read-only
  - actual date auto-filled from `class_logs` when a matching curriculum section has been logged
  - remarks editable
- Save entries row-by-row.

### New admin page
Create:

- `src/pages/admin/AdminLessonPlans.tsx`

Route:

- `/dashboard/admin/lesson-plans`

Sidebar:

- Add “Lesson Plans” to admin dashboard.

Features:

- View all tutor lesson plans.
- Filter by tutor, subject, semester, published status.
- Open read-only detail view.
- Download PDF for any plan.

### Class log integration
Modify:

- `src/pages/instructor/InstructorClassLog.tsx`

Changes:

- Ensure class logs are linked to `curriculum_section_id`.
- When a tutor logs a class against a curriculum topic, lesson plan entries for that topic can auto-populate `actual_date`.
- Keep existing class log behavior unchanged.

---

## 5. Lesson Plan PDF Download

Modify/create:

- `src/lib/lessonPlanPdf.ts`
- use existing `jspdf` and `jspdf-autotable` dependency already present in `package.json`

Features:

- Generate official formatted lesson plan PDF.
- Use official colors:
  - table headers `#7e2320`
  - accents `#E0AC27`
  - cream background `#FFFDE9`
- Include:
  - official header section
  - department / semester / section / course code
  - teacher and designation
  - CIE/SEE/exam details
  - module summary table
  - course outcomes table
  - lecture log table
  - signature footer
- Keep PDF generation client-side to avoid adding backend function complexity.
- Add graceful fallback if a browser blocks download.

---

## 6. Admin UX Fixes

### Notification/count badges
Modify:

- `src/components/DashboardSidebar.tsx`
- relevant admin overview/stat/quick-action components

Changes:

- Show count badges only when count > 0.
- Derive counts from existing data:
  - pending approvals from unverified users/content reviews
  - unread messages from `messages.is_read = false`
  - feedback count from recent feedback rows
  - assignment submissions from ungraded submissions
  - pending enrollments if represented in existing data
- On page open, mark relevant unread records as read where supported, especially messages.
- If a dedicated `notifications` table is required later, add it separately; for this pass, use existing tables to avoid unnecessary duplication.

### Users section split
Modify:

- `src/components/DashboardSidebar.tsx`
- `src/App.tsx`
- `src/pages/admin/AdminStudents.tsx`
- create `src/pages/admin/AdminTeachers.tsx`

Changes:

- Rename combined users area to “Users”.
- Add separate routes:
  - `/dashboard/admin/students`
  - `/dashboard/admin/teachers`
- Students page:
  - Photo, name, roll no, programme, current batch, enrollment date, status, actions
  - assign batch modal
  - bulk assign selected students to batch
  - programme/batch/status filters
  - name/roll search
- Teachers page:
  - Photo, name, employee ID, department, designation, assigned batches, assigned subjects, actions
  - assign subjects modal using `subject_allocations`
  - assign batch modal
  - department/designation filters

---

## 7. Batches UX Redesign

Modify:

- `src/pages/admin/AdminBatches.tsx`

Changes:

- Replace simple table-first layout with attractive linked-programme batch cards.
- Show:
  - batch name/code/status
  - linked programme/course
  - term/semester
  - subjects available this term from curriculum modules
  - student count
  - tutor name
- Manage Batch dialog/page tabs:
  - Students
  - Subjects
  - Timetable
  - Live Classes
- Keep existing create/edit/delete/enrollment functions.

---

## 8. Live Classes Auto Status

Modify:

- `src/pages/instructor/TutorLiveClasses.tsx`
- `src/pages/admin/AdminLiveClasses.tsx`
- `src/pages/dashboard/StudentLiveClasses.tsx`
- shared helper `src/lib/liveClassStatus.ts`

Changes:

- Compute class state from time, not only from `status`.
- Any class where `scheduled_at + duration_minutes < now()` appears in Past.
- Add status badges:
  - Scheduled
  - Live Now
  - Completed
  - Cancelled
  - Expired
- On admin/tutor page load, update live class statuses where allowed by RLS:
  - scheduled
  - live
  - completed
- Keep cancelled classes unchanged.

---

## 9. Feedback Filters

Modify:

- `src/pages/admin/AdminFeedback.tsx`

Changes:

- Add filter bar:
  - About tutor
  - Category
  - Minimum rating
  - Date range
  - Clear filters
- Fetch instructor profiles for the tutor filter.
- Support existing JSONB `categories` array and legacy `category` field.
- Rating filter will work against both top-level `rating` and category-level ratings.
- CSV export will respect active filters.

---

## 10. Weekly Timetable Grid

Modify:

- `src/pages/admin/AdminSchedule.tsx`

Changes:

- Redesign from list into weekly grid:
  - 7 columns Mon–Sun
  - hourly slots 6 AM–9 PM
  - horizontal scroll on mobile
- Add filters:
  - all
  - batch
  - instructor
- Add week navigation:
  - previous week
  - current week
  - next week
- Clicking a slot opens editor modal/drawer:
  - title
  - type
  - batch
  - subject
  - instructor
  - start/end time
  - recurrence
  - room/location
  - save/delete
- Preserve current schedule creation behavior while making it grid-based.

---

## 11. Events Big Calendar View

Modify:

- `src/pages/Events.tsx`
- `src/pages/admin/AdminEvents.tsx`

Changes:

- Public `/events`:
  - large monthly calendar
  - dots on dates with events
  - today highlight
  - selected date highlight
  - click date to show events below calendar
  - no modal for public page
  - attractive event cards using official colors
- Admin `/dashboard/admin/events`:
  - same calendar style
  - click date to add event
  - click event card to edit/delete
  - keep list/data management controls accessible
- Add mobile layout:
  - compact calendar
  - readable event cards
  - no horizontal overflow

---

## 12. App routing and navigation

Modify:

- `src/App.tsx`
- `src/components/DashboardSidebar.tsx`

Add routes:

- `/dashboard/tutor/lesson-plans`
- `/dashboard/admin/lesson-plans`
- `/dashboard/admin/teachers`

Update sidebar:

- Tutor: add Lesson Plans
- Admin: Users → Students / Teachers
- Admin: add Lesson Plans
- Preserve all existing routes.

---

## 13. Validation and QA

After implementation:

- Verify build/typecheck.
- Test public pages:
  - landing page theme
  - events calendar
  - mobile menu
- Test admin:
  - students page
  - teachers page
  - batches manage tabs
  - timetable grid
  - feedback filters
  - admin events calendar
  - lesson plans overview
- Test tutor:
  - lesson plans list/edit
  - class log date sync
  - PDF download
  - live class past/live status behavior
- Test student:
  - live class status display remains correct
  - dashboard/sidebar still responsive
- Check mobile layouts at 320px, 360px, 432px, and desktop widths.

## Files expected to be modified/created

### New files
- `src/pages/instructor/TutorLessonPlans.tsx`
- `src/pages/admin/AdminLessonPlans.tsx`
- `src/pages/admin/AdminTeachers.tsx`
- `src/lib/lessonPlanPdf.ts`
- `src/lib/liveClassStatus.ts`
- new backend migration for curriculum/lesson-plan/schedule/event enhancements

### Modified files
- `src/index.css`
- `tailwind.config.ts`
- `src/components/ui/card.tsx`
- `src/components/DashboardSidebar.tsx`
- `src/App.tsx`
- `src/pages/admin/AdminCurriculum.tsx`
- `src/pages/instructor/TutorCurriculum.tsx`
- `src/pages/instructor/InstructorClassLog.tsx`
- `src/pages/admin/AdminStudents.tsx`
- `src/pages/admin/AdminBatches.tsx`
- `src/pages/admin/AdminFeedback.tsx`
- `src/pages/admin/AdminSchedule.tsx`
- `src/pages/admin/AdminEvents.tsx`
- `src/pages/Events.tsx`
- `src/pages/admin/AdminLiveClasses.tsx`
- `src/pages/instructor/TutorLiveClasses.tsx`
- `src/pages/dashboard/StudentLiveClasses.tsx`

