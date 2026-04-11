

## 4-Role Access Control: Super Admin, Admin, Educator, Student

### Current State
The system has 3 roles via the `app_role` enum: `admin`, `instructor`, `student`. All admin routes use `allowedRoles={["admin"]}`. The `has_role()` security definer function and `handle_new_user()` trigger use this enum.

### What Needs to Change

#### 1. Database Migration — Add `super_admin` role to enum + approval system

- **Alter the `app_role` enum** to add `'super_admin'` as a new value
- **Add `is_verified` column to `profiles`** (boolean, default `false`) — new educator/student signups start unverified; Super Admin must approve before they can access dashboards
- **Update `has_role()` function** — no change needed (it checks exact role match)
- **Create a helper function `is_super_or_admin()`** — returns true if user has `super_admin` or `admin` role, used in RLS policies
- **Update all existing RLS policies** that reference `'admin'` to also allow `'super_admin'` (about 30+ policies across all tables)

#### 2. Auth & Verification Flow

- **Update `handle_new_user()` trigger** — set `is_verified = false` for student/instructor signups. Super Admin and Admin accounts (created manually or by Super Admin) start verified.
- **Update `ProtectedRoute`** — after login, if `is_verified = false`, redirect to a "Pending Approval" page instead of the dashboard
- **Create a "Pending Approval" page** — simple message: "Your account is awaiting verification by the administrator"
- **Super Admin approval UI** in AdminStudents page — show unverified users with an "Approve" button that sets `is_verified = true`

#### 3. Frontend Role Type Updates

Files to update with the new `UserRole` type (`"super_admin" | "admin" | "instructor" | "student"`):

| File | Change |
|---|---|
| `src/hooks/useAuth.tsx` | Add `super_admin` to `UserRole` type |
| `src/components/RoleProtectedRoute.tsx` | Add `super_admin` to type + `getRoleDashboardPath` |
| `src/components/DashboardSidebar.tsx` | Add `superAdminNav` with full nav (all admin items + user management) |
| `src/App.tsx` | Update all admin routes to `allowedRoles={["super_admin", "admin"]}`, add super-admin-only routes |

#### 4. Super Admin Dashboard — Extra Capabilities

Super Admin gets the same admin dashboard plus:
- **User Verification tab** — approve/reject new signups (educators and students)
- **Admin Management** — ability to create/delete admin accounts (admin cannot do this)
- **Full Activity Log** — can see all actions including admin actions
- **Role Management** — can change any user's role

Admin gets:
- Everything currently in the admin dashboard
- Cannot create/delete other admins
- Cannot change roles
- Cannot see super admin actions in activity log

#### 5. Access Control Matrix

```text
Feature                    SuperAdmin  Admin  Educator  Student
─────────────────────────  ──────────  ─────  ────────  ───────
Verify new signups         Yes         No     No        No
Create/delete admins       Yes         No     No        No
Change user roles          Yes         No     No        No
Manage courses/curriculum  Yes         Yes    Own only  View
Manage timetable           Yes         Yes    No        No
Manage categories/events   Yes         Yes    No        No
View activity log          Yes         Yes*   No        No
Approve content            Yes         Yes    No        No
Subject allocation         Yes         Yes    No        No
Manage students            Yes         Yes    No        No
Create assignments         No          No     Yes       No
Log classes                No          No     Yes       No
Submit assignments         No          No     No        Yes
```
*Admin sees all except super admin actions

#### 6. Registration — No Change Needed for Role Selection

Students and Educators register as before. Admin and Super Admin accounts are created only by an existing Super Admin through the dashboard (not through self-registration). The first Super Admin must be seeded manually in the database.

### Files to Create
| File | Purpose |
|---|---|
| `src/pages/PendingApproval.tsx` | Shown to unverified users after login |
| `src/pages/admin/AdminUserVerification.tsx` | Super Admin approves new signups |

### Files to Edit
| File | Change |
|---|---|
| `src/hooks/useAuth.tsx` | Add `super_admin` to UserRole, fetch `is_verified` from profiles |
| `src/components/RoleProtectedRoute.tsx` | Add `super_admin` routing, check `is_verified` |
| `src/components/DashboardSidebar.tsx` | Add `superAdminNav`, update role label/logic |
| `src/App.tsx` | Add `super_admin` to admin route allowedRoles, add verification routes |
| `src/pages/Register.tsx` | No change (only student/educator self-register) |
| `src/pages/admin/AdminStudents.tsx` | Add "Create Admin" button for super_admin only |
| `src/pages/admin/AdminOverview.tsx` | Show verification pending count for super_admin |

### Database Migration
1. `ALTER TYPE public.app_role ADD VALUE 'super_admin';`
2. `ALTER TABLE public.profiles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;`
3. Update `handle_new_user()` to set `is_verified = false` for student/instructor
4. Update ~30 RLS policies to include `super_admin` alongside `admin`
5. Create `is_super_or_admin()` helper function for cleaner RLS

### Seeding the First Super Admin
After migration, you will need to manually update one existing admin user's role to `super_admin` via a database insert. This is a one-time operation.

