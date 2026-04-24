

# Phase 2 — Verification & Remaining Gaps

I checked the codebase. The Phase 2 work landed in the previous turn, but a few items still need polish. Here's the focused gap-fix plan.

## Status snapshot

| Area | Status | Gap to fix |
|---|---|---|
| Sidebar + routes | Done | Verify Subject Allocation duplicate removed |
| Feedback (admin reply) | Done | Verify reply visible in StudentFeedback |
| Timetable | Done | None |
| Events + tutor/student pages | Done | Add `TutorEvents.tsx` route (only `DashboardEvents.tsx` was created) |
| Tutor's Courses | Done | None |
| Categories → Programs | Done | None |
| Jobs | Done | None |
| Activity Log labels | Done | None |
| Sidebar badges | Done | None |

## Gap-fixes to implement

1. **Create `src/pages/instructor/TutorEvents.tsx`** — tutor-side events page mirroring `DashboardEvents.tsx`: list approved events + form to submit internal event (auto `is_internal=true`, `approval_status='pending'`, `created_by=auth.uid()`), with overlap warning against `schedules`.
2. **Wire route in `src/App.tsx`** — add `/dashboard/instructor/events` under the instructor `RoleProtectedRoute`.
3. **Add Events link in `DashboardSidebar.tsx`** for instructor role (student link already present).
4. **Verify `StudentFeedback.tsx`** renders admin replies from `feedback_responses` (read-only check; patch only if missing).
5. **Build validation** — typecheck, ensure no `TS2589` regressions.

## Out of scope

No DB migrations needed — `events` table already has `created_by`, `is_internal`, `approval_status`. RLS already permits tutor inserts.

## Files touched

- `src/pages/instructor/TutorEvents.tsx` (new)
- `src/App.tsx` (route)
- `src/components/DashboardSidebar.tsx` (instructor nav item)
- `src/pages/dashboard/StudentFeedback.tsx` (only if reply rendering missing)

