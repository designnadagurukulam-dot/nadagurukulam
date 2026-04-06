

## Complete LMS Audit & Fix Plan

### Issues Found

**Critical Bugs:**
1. **Instructor sidebar "Overview" links to `/dashboard`** — a student-only route. Instructors get redirected away. No instructor overview page exists.
2. **Student DashboardOverview links to `/catalog`** — route doesn't exist. Should be `/courses`.
3. **AdminSchedule requires selecting individual students** — impractical for class-wide scheduling. Should support "All Students" or course-based assignment.
4. **DashboardSchedule only queries `user_id = current user`** — instructors viewing their schedule at `/dashboard/instructor/schedule` won't see entries where they're the `instructor_id` but not the `user_id`.
5. **Profile page doesn't show role-specific fields** — employee_id, roll_number, designation, course_name, year_of_commencement are stored but never displayed or editable.
6. **Missing Subject Allocation admin page** — table exists, no UI built yet.

**UI/UX Issues:**
7. **InstructorCourses page missing `pt-12 lg:pt-0`** top padding for mobile (sidebar toggle overlap).
8. **InstructorStudents page** same missing top padding.
9. **InstructorAnalytics** same missing top padding.
10. **AdminOverview** same missing top padding.
11. **AdminApprovals** same missing top padding.
12. **AdminActivityLog** same missing top padding.
13. **DashboardCurriculum** same missing top padding.
14. **AdminSchedule** same missing top padding.
15. **InstructorClassLog** same missing top padding.

**Data Integrity Issues:**
16. **DashboardSchedule for instructors** — should query by `instructor_id` OR `user_id` depending on role.
17. **Class log visibility** — students see ALL class logs (no filtering by enrolled courses works because RLS depends on `schedule_id` join, but class logs may have `schedule_id = null`). Students could see unrelated logs.
18. **Certificate upload** doesn't associate with a course — just uploads to storage with no database record linking it.
19. **Admin overview "Total Students" counts all profiles** including admins/instructors — should filter by student role.

---

### Implementation Plan

#### Step 1: Fix routing & navigation bugs
- **DashboardSidebar**: Change instructor "Overview" link from `/dashboard` to `/dashboard/instructor`
- **App.tsx**: Add route `/dashboard/instructor` pointing to a new `InstructorOverview` component
- **DashboardOverview**: Fix `/catalog` links → `/courses`
- Create `src/pages/instructor/InstructorOverview.tsx` — quick stats (my courses, my students, pending class logs, upcoming schedule)

#### Step 2: Fix mobile padding on all dashboard pages
Add `pt-12 lg:pt-0` to the root container of these 9 pages:
- InstructorCourses, InstructorStudents, InstructorAnalytics, InstructorClassLog
- AdminOverview, AdminApprovals, AdminActivityLog, AdminSchedule
- DashboardCurriculum

#### Step 3: Fix DashboardSchedule for instructor role
- Query schedules where `instructor_id = user.id` OR `user_id = user.id` using `.or()` filter
- This ensures instructors see classes assigned to them

#### Step 4: Fix AdminSchedule — bulk student assignment
- Replace single student dropdown with multi-select or "All enrolled students" option
- When "All enrolled students" is selected and a course is chosen, create schedule entries for every student enrolled in that course
- This makes timetable management practical

#### Step 5: Enhance Profile page with role-specific fields
- Show and allow editing of: employee_id, designation (for instructors), roll_number, course_name, year_of_commencement (for students), department (for admins)
- Use `useAuth` role to conditionally render fields

#### Step 6: Build Admin Subject Allocation page
- Create `src/pages/admin/AdminSubjectAllocation.tsx`
- UI: Select instructor → Select curriculum module → Assign
- List existing allocations with delete option
- Add route + sidebar nav item

#### Step 7: Fix class log student visibility
- Class logs with `schedule_id = null` bypass the RLS join-based filter
- Fix: InstructorClassLog should require selecting a schedule or at minimum ensure the class log is associated properly
- DashboardClassLog: add client-side filter to only show logs from instructors who teach the student's enrolled courses (via subject_allocations)

#### Step 8: Fix AdminOverview stats accuracy
- "Total Students" should count only users with student role, not all profiles
- Add counts for instructors and admins separately

#### Step 9: Add missing activity log action colors
- `schedule.created`, `schedule.deleted`, `class_log.created`, `class_log.confirmed`, `project.created`, `project.deleted`, `certificate.uploaded`, `profile.updated` — add to actionColors map

---

### Files to Create
| File | Purpose |
|---|---|
| `src/pages/instructor/InstructorOverview.tsx` | Instructor dashboard home |
| `src/pages/admin/AdminSubjectAllocation.tsx` | Subject-teacher allocation UI |

### Files to Edit
| File | Changes |
|---|---|
| `src/components/DashboardSidebar.tsx` | Fix instructor Overview link, add Subject Allocation to admin nav |
| `src/App.tsx` | Add instructor overview + subject allocation routes |
| `src/pages/dashboard/DashboardOverview.tsx` | Fix `/catalog` → `/courses` |
| `src/pages/dashboard/DashboardSchedule.tsx` | Query by instructor_id for instructor role |
| `src/pages/dashboard/DashboardProfile.tsx` | Add role-specific profile fields |
| `src/pages/dashboard/DashboardClassLog.tsx` | Add instructor name, better filtering |
| `src/pages/dashboard/DashboardCurriculum.tsx` | Add top padding |
| `src/pages/admin/AdminOverview.tsx` | Fix stats, add top padding |
| `src/pages/admin/AdminSchedule.tsx` | Bulk student assignment, add top padding |
| `src/pages/admin/AdminApprovals.tsx` | Add top padding |
| `src/pages/admin/AdminActivityLog.tsx` | Add missing action colors, add top padding |
| `src/pages/instructor/InstructorCourses.tsx` | Add top padding |
| `src/pages/instructor/InstructorStudents.tsx` | Add top padding |
| `src/pages/instructor/InstructorAnalytics.tsx` | Add top padding |
| `src/pages/instructor/InstructorClassLog.tsx` | Add top padding |

### No database changes needed
All tables and columns already exist.

