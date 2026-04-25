

# Phase 4 — Users Tab Consolidation + Detail Spacing Fix

Two focused changes based on your feedback. No new features, no destructive DB changes.

---

## 1) Consolidate Verification → unified "Users" tab

**Current state:** `AdminUserVerification.tsx` is a separate sidebar entry showing only pending users. `AdminStudents.tsx` and `AdminTeachers.tsx` show verified users by role. This split is confusing — you want one place to manage everyone.

**New structure — single sidebar entry "Users"** (replacing the three current entries: Verification, Students, Teachers):

- New page: `src/pages/admin/AdminUsers.tsx`
- Top-level tabs inside the page:
  - **All** (everyone)
  - **Students**
  - **Teachers**
  - **Admins** (super_admin + admin)
- Inside each tab, a status filter pill row: **All / Verified / Pending**
- Default landing view: "All" tab → "Pending" filter (so verification work is the first thing you see).
- Pending count badge on the sidebar "Users" entry stays the same (uses existing `is_verified=false` count).
- All existing actions kept:
  - Approve / Revoke verification
  - Change role (dropdown directly in the Role column — already done in Phase 1)
  - Edit profile
  - Reset password / suspend (existing)
- Bulk actions row (select multiple → bulk verify) preserved from `AdminUserVerification.tsx`.

**Sidebar changes (`DashboardSidebar.tsx`):**
- Remove: `Verification`, `Students`, `Teachers` entries.
- Add single `Users` entry → `/dashboard/admin/users`.
- Keep the same badge logic (pending count).

**Routing (`App.tsx`):**
- Add new `/dashboard/admin/users` route.
- Keep old routes (`/admin/students`, `/admin/teachers`, `/admin/verification`) as redirects to the new Users page so existing bookmarks don't break.

## 2) Detail panel spacing fix

The user-detail expand panel currently has cramped single-line statements. Apply consistent spacing:

- Wrap each detail line in a row with `py-2` and `border-b border-brand-warm-grey/10` for visual separation.
- Group related fields into labeled sections with `space-y-4`:
  - **Account** (email, role, verification status, joined date)
  - **Profile** (display name, phone, designation/program)
  - **Academic** (roll number / employee id, batch, year of commencement, semester) — only relevant fields per role
  - **Activity** (last login, total assignments, etc.)
- Section headers use `text-sm font-semibold text-brand-primary uppercase tracking-wide mb-2`.
- Empty fields render as muted "—" instead of being hidden, so layout stays consistent.
- Mobile: stack sections vertically with `gap-4` instead of side-by-side grid.

This applies to the detail panel inside the new `AdminUsers.tsx` (consolidated from current Students/Teachers/Verification detail views).

---

## Files touched

- **New:** `src/pages/admin/AdminUsers.tsx` (consolidated page)
- **Edited:** `src/components/DashboardSidebar.tsx` (single Users entry)
- **Edited:** `src/App.tsx` (new route + legacy redirects)
- **Possibly removed/kept-as-stub:** `AdminStudents.tsx`, `AdminTeachers.tsx`, `AdminUserVerification.tsx` — keep files for reference but only the consolidated route is linked from the sidebar.

## Database

No changes. Reuses existing `profiles`, `user_roles`, `is_verified`.

## Implementation order

1. Build `AdminUsers.tsx` combining the three pages with tabs + status filter
2. Apply the new spaced detail panel layout
3. Update sidebar (remove three entries, add one)
4. Add route + redirects in `App.tsx`
5. Verify pending badge still works
6. TS check

## Open question

**Should the old Verification / Students / Teachers sidebar entries be removed entirely**, or **kept as quick-filter shortcuts** that open the Users tab pre-filtered (e.g. clicking "Teachers" opens Users → Teachers tab)?

Default if you don't answer: **remove entirely** — the Users tab handles everything.

