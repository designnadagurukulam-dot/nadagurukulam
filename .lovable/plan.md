

## Super Admin Activity Tracking System

### Overview

Build a comprehensive audit log that records every meaningful action by educators and students, with timestamps, so the admin can monitor all platform activity from a single dashboard.

### Activities to Track

**Authentication Events**
- Login (successful + failed attempts)
- Logout
- Password reset request
- Account registration (student/educator)

**Educator Activities**
- Course created / updated / deleted
- Course status changed (draft → submitted → approved)
- Course module added / updated / deleted
- Course lesson added / updated / deleted
- Curriculum section added / updated / deleted
- Curriculum section links added / deleted
- Assignment created / updated / deleted
- Assignment graded (submission feedback given)
- Profile updated

**Student Activities**
- Enrolled in a course
- Assignment submitted
- Lesson started / completed (lesson progress update)
- Course completed (certificate earned)
- Profile updated

**Admin Activities**
- Course approved / rejected (content review)
- Enrollment managed (added/removed)
- User role changed
- Event created / updated / deleted
- Category created / updated / deleted
- Coupon created / updated / deleted
- Job posting created / updated / deleted

### Database Changes

**New table: `activity_logs`**

```text
activity_logs
├── id (uuid PK)
├── user_id (uuid) — who performed the action
├── action (text) — e.g. 'course.created', 'assignment.submitted'
├── entity_type (text) — e.g. 'course', 'assignment', 'enrollment'
├── entity_id (uuid, nullable) — ID of the affected record
├── metadata (jsonb, nullable) — extra context (course title, old/new values, IP, etc.)
├── created_at (timestamptz, default now()) — the timestamp
```

**RLS policies:**
- Admins can SELECT all logs
- Authenticated users can INSERT their own logs (user_id = auth.uid())
- No UPDATE/DELETE allowed (audit logs are immutable)

### Implementation Approach

**1. Utility helper** — `src/lib/activityLogger.ts`
- A single function `logActivity(action, entityType, entityId?, metadata?)` that inserts into `activity_logs` using the current authenticated user
- Called from existing components after successful operations

**2. Instrument existing pages** — Add `logActivity()` calls to:
- `useAuth.tsx` — login, logout, signup events
- `CreateCourse.tsx` — course creation
- `InstructorAssignments.tsx` — assignment CRUD, grading
- `DashboardAssignments.tsx` — student submission
- `AdminCurriculum.tsx` — curriculum changes
- `DashboardCurriculum.tsx` — curriculum section views (optional)
- `DashboardProfile.tsx` — profile updates
- `CourseDetail.tsx` — enrollment
- `LessonPlayer.tsx` — lesson progress
- `AdminApprovals.tsx` — course review decisions
- `AdminEvents.tsx`, `AdminCategories.tsx`, `AdminCoupons.tsx`, `AdminJobs.tsx` — admin CRUD actions

**3. New admin page** — `src/pages/admin/AdminActivityLog.tsx`
- Table view of all activity logs with:
  - Filters by: user, action type, entity type, date range
  - Search by user name or action
  - Sortable by timestamp (newest first)
  - Shows: user display name, action, entity, timestamp, metadata preview
- Pagination for large datasets

**4. Sidebar + routing**
- Add "Activity Log" link to admin sidebar
- Add route `/dashboard/admin/activity` in `App.tsx`

### Files to Create/Edit

| Action | File |
|--------|------|
| Create | `supabase migration` — `activity_logs` table + RLS |
| Create | `src/lib/activityLogger.ts` |
| Create | `src/pages/admin/AdminActivityLog.tsx` |
| Edit | `src/hooks/useAuth.tsx` — log login/logout/signup |
| Edit | `src/pages/instructor/CreateCourse.tsx` — log course creation |
| Edit | `src/pages/instructor/InstructorAssignments.tsx` — log assignment CRUD + grading |
| Edit | `src/pages/dashboard/DashboardAssignments.tsx` — log submissions |
| Edit | `src/pages/admin/AdminCurriculum.tsx` — log curriculum changes |
| Edit | `src/pages/admin/AdminApprovals.tsx` — log approvals |
| Edit | `src/pages/admin/AdminEvents.tsx` — log event CRUD |
| Edit | `src/pages/admin/AdminCategories.tsx` — log category CRUD |
| Edit | `src/pages/admin/AdminCoupons.tsx` — log coupon CRUD |
| Edit | `src/pages/admin/AdminJobs.tsx` — log job CRUD |
| Edit | `src/pages/dashboard/DashboardProfile.tsx` — log profile updates |
| Edit | `src/components/DashboardSidebar.tsx` — add Activity Log nav item |
| Edit | `src/App.tsx` — add route |

### Technical Notes

- All logging is fire-and-forget (non-blocking) — failures to log do not break the user flow
- The `metadata` JSONB column stores contextual details like course title, old/new status, submission file name, etc.
- Timestamps use server-side `now()` for accuracy
- Activity logs are append-only (no update/delete) to maintain audit integrity

