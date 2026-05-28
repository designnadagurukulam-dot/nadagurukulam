
# Phase 8 — Users, Allocations, Live Classes, Auth

## 1. Subject Allocation → folded into Curriculum

- Delete the standalone **Subject Allocation** tab + page + sidebar entry.
- In Curriculum → Program → Semester → **Course (Module)** form, the existing **Instructor** and **Batch** dropdowns become the allocation. Saving them writes to `curriculum_modules.instructor_id` / `batch_id` (already present) AND mirrors a row in `subject_allocations` so existing instructor-facing queries (TutorCurriculum, dashboards) keep working.
- Course detail banner already shows instructor name — no change needed; it will reflect the allocation made in the form.

## 2. Users tab — clickable tiles + full profiles

### Tiles → table views

Make `Students`, `Instructors`, `Admins`, `Pending Verification` tiles clickable filters that render a table on the same page:

- **Students table:** Name, Enrollment ID, Program, Status (pending rows pinned to top).
- **Instructors table:** Name, Employee ID, Program/Department, Status (pending pinned).
- **Admins table:** Name, Email, Admin Label.
- **Pending Verification table:** Name, Role, Submitted date, Approve/Reject inline.

Clicking a name routes to `/dashboard/admin/users/:userId` — a full profile view.

### Profile schema additions (new migration)

Add to `public.profiles`:

- Contact: `email` (cached from auth), already have `phone`, `date_of_birth`, `gender`, `address`.
- New: `blood_group`, `father_name`, `father_occupation`, `father_email`, `father_phone`, `mother_name`, `mother_occupation`, `mother_email`, `mother_phone`, `family_notes`.
- New for instructors: `instructor_type` ('regular' | 'guest').
- KYC already has `kyc_document_type/number/url`; add `aadhar_number`, `pan_number`, `passport_number` (admin-only via RLS column-level handling in UI).

### Profile edit approval workflow (students only)

New table `public.profile_change_requests`:

- `id`, `user_id`, `requested_changes` (jsonb), `status` ('pending' | 'approved' | 'rejected'), `reviewed_by`, `reviewed_at`, `note`, `created_at`.
- Student submits edits → row inserted with status 'pending'. The student's `profiles` row is NOT updated until admin approves.
- Admin Approvals page gets a new **Profile Edits** tab to review/apply/reject. On approve, merge `requested_changes` into `profiles`.
- Instructors edit their own personal/qualifications/specialization fields directly (no approval).
- KYC fields are admin-only on both student and instructor profiles (hidden in self-view).

### Routes

- `/dashboard/admin/users` (existing tile grid).
- `/dashboard/admin/users/students`, `.../instructors`, `.../admins`, `.../pending` (table views).
- `/dashboard/admin/users/:userId` (full profile, admin view with edit).
- `/dashboard/profile` (existing) — extend with new personal/family fields for students (submit goes through approval); instructors edit directly.

### Security tab (all users)

Add `Security` section to `/dashboard/profile`:

- **Change password** — re-auth with old password, then `supabase.auth.updateUser({ password })`.
- For admins viewing a user profile: **Reset password** button (disabled for admin/super_admin targets) — invokes `supabase.auth.admin.updateUserById` via a new edge function `admin-reset-password` (service-role) or generates a recovery link via `generateLink`. Edge function checks caller is super_admin/admin and target is not an admin.

## 3. Login page changes

- Remove the **Student / Tutor** segmented toggle from `/login`. Just email + password fields.
- Add a small `Sign in as admin` link below → routes to `/admin-login`.
- On `/admin-login`, add **Forgot password?** link → new `/forgot-password` page calling `resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
- New `/reset-password` page (public route) that handles the recovery token and calls `updateUser({ password })`.

## 4. Live Classes tab

- Remove **All-time online** stat tile. Replace with **Total Classes** = count of online classes only.
- Filters bar: Instructor (select), Batch (select), Status (Scheduled/Completed/Cancelled), Platform (Zoom/Meet/Other — inferred from `meeting_link`).
- Tile **Total online hours** is clickable → opens a dialog with a per-instructor breakdown (table: Instructor, Classes, Total hours).
- Instructor tile click → dialog redesigned. Show Employee ID, Program/Department, Designation, Instructor Type (Regular/Guest), Meeting links. Remove "Courses allocated".
- "No meeting links — Contact admin" banner: show only for instructor role. For admin/super_admin show subtle inline "No meeting links created".

## 5. Terminology unification — "Instructor"

Global rename across UI strings only (no DB / role identifier changes): replace user-facing **Tutor** and **Teacher(s)** with **Instructor(s)**.

Files touched (UI text only): sidebars, tile labels, page headers, dashboard titles in:

- `DashboardSidebar.tsx`, `AdminOverview.tsx`, `AdminTeachers.tsx` (renamed to `AdminInstructors.tsx`), `AdminSchedule.tsx`, `AdminLiveClasses.tsx`, tutor dashboard headings, `LoginSelect.tsx` copy, etc.
- DB enum value `'instructor'` stays as-is. Routes `/dashboard/tutor/*` stay to avoid breaking deep links; only labels change.

## Technical Notes

- **Migration adds**: profiles columns above, `profile_change_requests` table + RLS (owner can insert/select own pending, admin can select/update all), grants for both, optional `instructor_type` default `'regular'`.
- **Edge function**: `admin-reset-password` (verify_jwt = true, role check via service-role client). New `supabase/functions/admin-reset-password/index.ts`.
- **No business-logic change** to existing Curriculum behavior beyond surfacing instructor/batch fields as the allocation source.

## Files

**New:** `src/pages/admin/AdminUserProfile.tsx`, `src/pages/admin/users/StudentsList.tsx`, `InstructorsList.tsx`, `AdminsList.tsx`, `PendingList.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`, `src/components/admin/ProfileChangeRequestsTab.tsx`, `src/components/dashboard/SecurityTab.tsx`, `supabase/functions/admin-reset-password/index.ts`.

**Edited:** `App.tsx` (routes), `DashboardSidebar.tsx` (remove Subject Allocation, rename Tutors→Instructors), `AdminCurriculum.tsx` (instructor+batch in module form, mirror to subject_allocations), `AdminLiveClasses.tsx` (filters, stats dialog, tile changes), `AdminTeachers.tsx` (rename + content tweaks), `AdminStudents.tsx` (collapse into table view), `AdminApprovals.tsx` (Profile Edits tab), `Login.tsx` (remove segmented control, add admin link), `AdminLogin.tsx` (forgot link), `DashboardProfile.tsx` (new fields + Security tab + approval-routed save for students).

**Deleted:** `AdminSubjectAllocation.tsx`, sidebar entry.

## Open decisions (defaulting unless you say otherwise)

1. Profile-edit approval folded into existing **Approvals** page as a new tab (not a separate route).
2. Admin password reset uses an edge function + service role so no email is sent — admin sets a temporary password shown once.
