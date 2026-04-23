
Fix the issue in two parts: immediate access recovery and permanent safeguards.

## 1) Emergency recovery of the Super Admin account

Restore the intended account in the backend so you can access the admin area again.

What will be done:
- Identify the exact account that should be `super_admin` using the existing user profile and role records.
- Reassign that account’s role in `user_roles` back to `super_admin`.
- Ensure the account remains verified so it is not redirected to the pending-approval page.
- Normalize the role row if needed so the account has the correct single role record.

Notes:
- The current data shows there are no `super_admin` records at all right now, which is why Super Admin-only access is gone.
- The recovery step should target the real owner account first, then refresh session/auth state.

## 2) Remove Super Admin from the normal Users list

Update the Users page so protected system accounts do not appear in the regular “Students & Users” management list.

Files:
- `src/pages/admin/AdminStudents.tsx`

Changes:
- Exclude `super_admin` accounts from the main users query/rendered list.
- Keep student/instructor/admin operational views intact.
- Update counts so the page reflects visible user categories correctly.
- If needed, show protected accounts only in a separate restricted area for Super Admin, not in the normal user list.

## 3) Stop this from happening again in the UI

The current Users page allows role changes too broadly, which is the likely source of the issue.

Files:
- `src/pages/admin/AdminStudents.tsx`
- `src/pages/admin/AdminUserVerification.tsx`

Changes:
- Remove role-changing controls from the general Users page for normal admin users.
- Allow protected role management only in the Super Admin-only verification/role-management flow.
- Prevent editing roles for any `super_admin` account from the generic list.
- Prevent self-demotion and self-role changes for the currently logged-in protected account.
- Restrict admins from changing admin/super_admin roles from the UI.

## 4) Add backend guardrails so protected roles cannot be accidentally removed

Add database-level protection so even a UI bug cannot remove the final Super Admin.

Backend work:
- Add a guard that blocks deleting or changing the last remaining `super_admin`.
- Tighten write access on `user_roles` so protected role changes require proper privilege.
- Ensure role changes for `admin` / `super_admin` are treated as privileged operations only.

Why this matters:
- UI-only restrictions are not enough.
- The safest fix is to protect the role table itself.

## 5) Verify routing and access after recovery

Files:
- `src/components/RoleProtectedRoute.tsx`
- `src/hooks/useAuth.tsx`

Checks:
- Confirm the restored account resolves as `super_admin`.
- Confirm it redirects to `/dashboard/admin` correctly.
- Confirm `/dashboard/admin/verification` becomes accessible again.
- Confirm student-only routing no longer captures that account.

## 6) Validation checklist

After implementation:
- Super Admin account can sign in and access admin dashboard again.
- Super Admin-only pages are reachable.
- Super Admin no longer appears in the normal Users list.
- Admins cannot accidentally change protected roles.
- Attempting to remove/demote the last Super Admin is blocked.
- Role badges/counts still render correctly across admin pages.

## Files likely involved

- `src/pages/admin/AdminStudents.tsx`
- `src/pages/admin/AdminUserVerification.tsx`
- `src/hooks/useAuth.tsx`
- `src/components/RoleProtectedRoute.tsx`

## Backend changes required

Yes — one backend data fix plus a small schema/security hardening change:
- Data fix: restore the correct account to `super_admin`
- Hardening: protect `user_roles` against accidental loss of the last Super Admin
