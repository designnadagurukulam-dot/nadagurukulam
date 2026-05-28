## Phase 9 — Finish pending work from Phase 8

### 1. Deploy `admin-reset-password` edge function
Deploy the already-written function so admins can issue temporary passwords from the user profile page.

### 2. Profile Edits approval queue in Admin Approvals
Add a new **Profile Edits** tab to `AdminApprovals.tsx` that lists all pending rows from `profile_change_requests` across all users (currently only visible per-user on `AdminUserProfile`). Each row shows: requester name + role, requested diff (field → old → new), submitted date, and Approve / Reject actions with optional note. Approving applies the JSONB diff to `profiles` and marks the request `approved`; rejecting marks it `rejected` with the note.

### 3. Student/Instructor self-service fields in DashboardProfile
Extend `DashboardProfile.tsx` Personal tab with the new fields:
- **Students:** blood group, father (name/occupation/email/phone), mother (name/occupation/email/phone), family notes.
- **Instructors:** blood group + instructor_type (regular/guest, read-only — only admin can change).
- **KYC fields** (aadhar/pan/passport) remain **admin-only** and are NOT shown in self-view for any role.

Behavior:
- **Student edits** → write to `profile_change_requests` as JSONB diff, show "Pending admin approval" banner with the list of fields awaiting review; disable resubmitting the same fields until reviewed.
- **Instructor/Admin edits** → write directly to `profiles`.

### 4. Update memory
Update `mem://features/role-specific-profiles` and add a new `mem://features/profile-edit-approval` memory documenting the diff-based approval workflow, KYC visibility rules, and the Approvals queue location. Update `mem://index.md` accordingly.

### Files
- **Edit:** `src/pages/admin/AdminApprovals.tsx`, `src/pages/dashboard/DashboardProfile.tsx`
- **New:** `src/components/admin/ProfileChangeRequestsTab.tsx`
- **Deploy:** `supabase/functions/admin-reset-password`
- **Memory:** `mem://features/profile-edit-approval`, update `mem://features/role-specific-profiles` and `mem://index.md`

No DB migrations needed — all tables/columns exist from Phase 8.
