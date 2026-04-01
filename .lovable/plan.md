

## Complete Activity Tracking — Gap Analysis & Implementation Plan

### Currently Tracked (14 files instrumented)
- **Auth**: login, logout, signup
- **Courses**: course.created, course.submitted, course.approved, course.rejected
- **Curriculum**: section_added, section_deleted, sections_added (from Create Course)
- **Assignments**: assignment.created, assignment.graded, assignment.submitted
- **Enrollment**: enrollment.created
- **Lessons**: lesson.completed
- **Profile**: profile.updated
- **Admin CRUD**: event.created/updated/deleted, category.created/updated/deleted, coupon.created/deleted, job.created/updated/deleted

### Missing — Activities NOT Currently Tracked

| # | Activity | File | Action Key |
|---|----------|------|------------|
| 1 | Admin deletes a course | `AdminCourses.tsx` | `course.deleted` |
| 2 | Admin changes user role | `AdminStudents.tsx` | `role.changed` |
| 3 | Coupon toggled active/inactive | `AdminCoupons.tsx` | `coupon.toggled` |
| 4 | Job toggled active/inactive | `AdminJobs.tsx` | `job.toggled` |
| 5 | Volunteer app status updated | `AdminJobs.tsx` | `volunteer.status_updated` |
| 6 | Inquiry status updated | `AdminInquiries.tsx` | `inquiry.status_updated` |
| 7 | Inquiry deleted | `AdminInquiries.tsx` | `inquiry.deleted` |
| 8 | Volunteer application submitted (public) | `Contact.tsx` | `volunteer.submitted` |
| 9 | Program inquiry submitted (public) | `InquiryFormDialog.tsx` | `inquiry.submitted` |
| 10 | Instructor deletes assignment | `InstructorAssignments.tsx` | `assignment.deleted` |
| 11 | Student exports data (PDF/Excel) | `AdminStudents.tsx` | `students.exported` |
| 12 | Curriculum module added (from admin) | `AdminCurriculum.tsx` | `curriculum.module_added` |
| 13 | Event toggled active/inactive | `AdminEvents.tsx` | `event.toggled` |

### Implementation Plan

**Files to edit** (add `import { logActivity }` where missing, then add one-line `logActivity(...)` calls after each successful mutation):

1. **`src/pages/admin/AdminCourses.tsx`** — Add logActivity import; add `logActivity("course.deleted", "course", id)` after delete succeeds.

2. **`src/pages/admin/AdminStudents.tsx`** — Add logActivity import; add `logActivity("role.changed", "user_role", userId, { newRole, previousRole })` after role update succeeds.

3. **`src/pages/admin/AdminCoupons.tsx`** — Add `logActivity("coupon.toggled", "coupon", coupon.id, { is_active: !coupon.is_active })` in `toggleActive`.

4. **`src/pages/admin/AdminJobs.tsx`** — Add `logActivity("job.toggled", ...)` in toggle onSuccess; add `logActivity("volunteer.status_updated", ...)` in updateVolStatus onSuccess.

5. **`src/pages/admin/AdminInquiries.tsx`** — Add logActivity import; add logs for inquiry status update and inquiry delete.

6. **`src/pages/Contact.tsx`** — Add `logActivity("volunteer.submitted", ...)` in volunteer mutation onSuccess (note: this is public/unauthenticated — logActivity will silently fail if no user, which is fine; skip if undesirable).

7. **`src/pages/instructor/InstructorAssignments.tsx`** — Check if assignment delete is tracked; add if missing.

8. **`src/pages/admin/AdminActivityLog.tsx`** — Add the new action keys to `actionColors` map so they render with proper badge colors.

### Summary of Changes

- **7 files edited** with simple one-line `logActivity()` additions
- **1 file updated** (AdminActivityLog) for display colors
- No database changes needed — the `activity_logs` table already supports all these entries
- All logging remains fire-and-forget; failures never block UI

