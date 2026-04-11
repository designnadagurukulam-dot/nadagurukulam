

## Document Requirements — Status Check & Remaining Plan

### COMPLETED (Already Implemented)

| # | Requirement | Status |
|---|---|---|
| 1 | Single unified login page (not student/educator split) | Done |
| 2 | Educator signup: name, email, contact, employee ID, designation, password | Done |
| 3 | Student signup: name, email, roll no, course dropdown, year, password | Done |
| 4 | Admin created by Super Admin with designation, department | Done |
| 5 | Course data entry (name, subject, paper code, units, topics, hours) | Done — curriculum_modules + curriculum_sections |
| 6 | Super Admin approval before publishing | Done — content_reviews workflow |
| 7 | Subject allocation to educators by admin | Done — AdminSubjectAllocation |
| 8 | Dynamic timetable by admin with flexible timings | Done — AdminSchedule |
| 9 | Schedule visible to educators and students | Done — DashboardSchedule |
| 10 | Educator class log (update topic covered after class) | Done — InstructorClassLog |
| 11 | Student confirmation of class logs | Done — DashboardClassLog |
| 12 | Analytics updated based on class logs (syllabus %) | Done — InstructorAnalytics |
| 13 | Assignments by educator (name, desc, course, due date, PDF) | Done — InstructorAssignments |
| 14 | Student assignment submission + status tracking | Done — DashboardAssignments |
| 15 | My Courses showing enrolled subjects from DB | Done — DashboardCourses |
| 16 | Curriculum (semester-based view) | Done — DashboardCurriculum |
| 17 | Student Projects/Presentations page | Done — DashboardProjects |
| 18 | Certificates page with upload capability | Done — DashboardCertificates |
| 19 | Educator overview page | Done — InstructorOverview |
| 20 | Activity/audit log | Done — AdminActivityLog |

---

### NOT YET IMPLEMENTED (Remaining Work)

| # | Requirement from Document | What's Missing |
|---|---|---|
| A | **Class log topics filtered by educator's allocated subjects only** | InstructorClassLog fetches ALL curriculum sections instead of filtering by subject_allocations table |
| B | **Assignment notifications** — students auto-notified when assignment created | No notification system exists |
| C | **Assignment late/on-time tracking** — educator sees who submitted before/after due date | InstructorAssignments shows submissions but no late vs on-time indicator |
| D | **Student list upload by admin** (bulk CSV) + auto-fill registration from roll number | Not built |
| E | **Temp password + forced change on first login** (OTP or magic link) | Not built |
| F | **Curriculum semester visibility filter** — students see only current + past semesters, not future | DashboardCurriculum shows ALL semesters openly |
| G | **Student overview — previous day's updates** | DashboardOverview shows stats but not yesterday's class activity |
| H | **Assignments segregated by subject** in student view | DashboardAssignments shows flat list, not grouped by subject |
| I | **My Courses: hours remaining, completion status from class logs** | DashboardCourses shows enrollment progress but not hours-based completion derived from class logs |
| J | **Schedule page doubles as class completion details view** | Document says schedule tab should also show what happened in each class slot — currently separate pages |

---

### Implementation Plan for Remaining Items

#### Step 1: Filter class log topics by allocated subjects (Item A)
- Edit `InstructorClassLog.tsx` — fetch `subject_allocations` for the logged-in instructor, then only show `curriculum_sections` belonging to those allocated modules
- Small change, high impact on data integrity

#### Step 2: Assignment late/on-time tracking (Item C)
- Edit `InstructorAssignments.tsx` — in the submissions view, compare `submitted_at` with assignment `due_date`
- Show badges: "On Time" (green) / "Late" (red) / "Not Submitted" (gray)
- Show counts: X submitted on time, Y submitted late, Z not submitted

#### Step 3: In-app notification system (Item B)
- Create `notifications` table: `id`, `user_id`, `type`, `title`, `message`, `read`, `entity_id`, `created_at`
- Create a notification bell component in the dashboard header
- When educator creates an assignment, insert notification rows for all enrolled students via a database trigger or client-side batch insert
- Enable Supabase Realtime on the notifications table
- **No external service needed — $0 cost**

#### Step 4: Student overview with yesterday's updates (Item G)
- Edit `DashboardOverview.tsx` — add a section showing class logs from the previous day (topic, instructor, confirmation status)
- Query `class_logs` where `date = yesterday` filtered by student's enrolled courses

#### Step 5: Curriculum semester filter (Item F)
- Edit `DashboardCurriculum.tsx` — use student's `year_of_commencement` from profile to calculate current semester
- Show current + past semesters normally, future semesters with a lock icon (greyed out, no content access)

#### Step 6: Assignments grouped by subject (Item H)
- Edit `DashboardAssignments.tsx` — group assignments by course/subject name with collapsible sections

#### Step 7: Bulk student CSV upload (Item D)
- Create `student_registry` table + RLS
- Create `AdminStudentUpload.tsx` — CSV upload using Papa Parse, parse and insert into `student_registry`
- Edit `Register.tsx` — when student enters roll number, auto-fetch from `student_registry` and pre-fill fields

#### Step 8: Admin invite flow (Item E)
- Instead of temp password + OTP, use Supabase's built-in `inviteUserByEmail` via an edge function
- Admin creates user → invite email sent → user clicks link and sets password
- **$0 cost, built-in functionality**

#### Step 9: Enrich My Courses with hours data (Item I)
- Edit `DashboardCourses.tsx` — calculate completed hours from confirmed `class_logs` vs total `hours` in `curriculum_modules`
- Show remaining hours and completion percentage per subject

#### Step 10: Schedule + class details combined view (Item J)
- Edit `DashboardSchedule.tsx` — for past schedule entries, show the associated class log (topic covered, confirmation status) inline

---

### External Integrations & Cost

| Service | Purpose | Cost |
|---|---|---|
| Papa Parse (npm) | CSV parsing for bulk upload | Free (MIT) |
| Supabase Realtime | Live notifications | Free (built-in) |
| Supabase invite flow | User invitations | Free (built-in) |
| **Total** | | **$0/month** |

No paid external services are required for any remaining items.

### Priority Order

```text
High Priority (Core functionality gaps):
  Step 1 → Class log topic filtering
  Step 2 → Assignment late/on-time tracking  
  Step 3 → Notification system

Medium Priority (UX improvements):
  Step 4 → Student overview with yesterday's updates
  Step 5 → Curriculum semester filter
  Step 6 → Assignments grouped by subject
  Step 9 → My Courses hours enrichment
  Step 10 → Schedule + class details

Lower Priority (Admin workflows):
  Step 7 → Bulk student CSV upload
  Step 8 → Admin invite flow
```

