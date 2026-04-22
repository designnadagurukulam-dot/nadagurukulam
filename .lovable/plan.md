
# Next Phase Plan — Complete Pending Items & Final Polish

## What is still pending from your approved plan

The previous phases completed major backend, lesson-plan scaffolding, timetable grid, events admin calendar, teacher/student/batch pages, feedback filters, and live-class status logic.

The remaining work is mainly **completion quality**: making the newly added systems fully usable, aligning old UI remnants with the new brand, and finishing mobile/admin polish.

---

## Phase 1 — Curriculum Enhancement Completion

### 1. Upgrade Admin Curriculum UI
Modify `src/pages/admin/AdminCurriculum.tsx`.

Current status:
- It still mainly supports adding basic sections/videos/text.
- It does not yet expose all new academic fields added in the database.

Add:
- Subject/module edit panel for:
  - Course objectives
  - Pedagogy
  - CIE marks
  - SEE marks
  - Exam hours
  - References
- Course Outcomes management:
  - Add/edit/delete CO rows
  - CO number
  - Description
  - RBT levels
  - Hours
- Section/topic fields:
  - RBT levels
  - CO mapping
  - Hours allocated
  - Teaching methodology
- Replace old hardcoded maroon/gold values with official `brand-*`/semantic theme tokens.
- Remove unnecessary visible card borders and use official soft shadows.

### 2. Upgrade Tutor Curriculum UI
Modify `src/pages/instructor/TutorCurriculum.tsx`.

Add:
- RBT level input when tutor adds a topic.
- CO mapping selector/input.
- Hours allocated.
- Teaching methodology.
- Display academic metadata on topic cards.
- Respect tutor permissions: tutors edit only their own content while institution modules remain view-only.

---

## Phase 2 — Lesson Plan System Completion

### 1. Improve Tutor Lesson Plans
Modify `src/pages/instructor/TutorLessonPlans.tsx`.

Current status:
- It exists, but is minimal and table-heavy.
- It mutates row data locally in a fragile way.

Improve:
- Add a proper selected module/card state.
- Show module summary:
  - Subject name
  - Course code
  - Semester
  - Total periods
  - Contact hours/week
  - Completion percentage
- Add editable lesson-plan header:
  - Academic semester
  - Section
  - Contact hours/week
  - Total periods
  - Published status
- Improve lecture rows:
  - Stable controlled row state instead of mutating fetched objects.
  - Topic dropdown auto-fills:
    - Topic title
    - RBT level
    - CO mapping
  - Auto-fill actual date from matching `class_logs.curriculum_section_id`.
  - Save row-by-row and optionally save all changed rows.
- Make the table mobile-friendly:
  - Desktop table
  - Mobile stacked lecture cards

### 2. Improve Admin Lesson Plans
Modify `src/pages/admin/AdminLessonPlans.tsx`.

Current status:
- It shows simple cards and PDF download only.

Add:
- Filters:
  - Tutor
  - Subject/module
  - Semester
  - Published/unpublished
- Read-only detail view:
  - Module info
  - Teacher info
  - CO table
  - Lecture log
  - Completion status
- Better empty/loading states.
- Mobile responsive layout.

### 3. Strengthen Lesson Plan PDF
Modify `src/lib/lessonPlanPdf.ts`.

Improve:
- Ensure all newly added fields are included:
  - Course objectives
  - Pedagogy
  - CIE/SEE/exam hours
  - References
  - CO table
  - Lecture plan table
- Better page breaks for long 60-period plans.
- Consistent official colors and typography fallback.
- Clear signature footer.

---

## Phase 3 — Brand Consistency Cleanup

Several files still contain old direct colors such as `#7D1E24`, `#C49A3C`, `#FAF6EE`, old card borders, and older visual styles.

### Clean up hardcoded styling in priority files
Modify:
- `src/pages/admin/AdminCurriculum.tsx`
- `src/pages/instructor/TutorCurriculum.tsx`
- `src/pages/instructor/InstructorClassLog.tsx`
- `src/pages/admin/AdminOverview.tsx`
- `src/pages/admin/AdminCategories.tsx`
- `src/pages/admin/AdminMessages.tsx`
- `src/pages/dashboard/StudentChat.tsx`
- `src/pages/instructor/TutorMessages.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`

Apply:
- Official maroon/gold/cream tokens.
- Jost/Cabin/EB Garamond typography consistently.
- Borderless premium cards where appropriate.
- Keep table row dividers only where needed.
- Keep all touch targets at least 44px on mobile.

---

## Phase 4 — Public Landing Page & Events Final Polish

### 1. Landing page final alignment
Modify `src/pages/Index.tsx`.

Improve:
- Hero spacing and mobile type scale.
- Button alignment and CTA consistency.
- Course/event/faculty sections with official brand tokens.
- Remove any remaining outdated gradients not matching the official palette.
- Ensure no horizontal overflow at 320px–432px widths.
- Improve section rhythm and alignment.

### 2. Public Events Calendar polish
Modify `src/pages/Events.tsx`.

Improve:
- Remove remaining border-heavy cards.
- Add event-type color dots using `event_type`.
- Make month calendar feel larger and more premium on desktop.
- Improve selected-day event cards.
- Better mobile calendar spacing.
- Keep public event flow simple: click date → events appear below, no modal.

### 3. Admin Events polish
Modify `src/pages/admin/AdminEvents.tsx`.

Improve:
- Event-type color legend.
- Better mobile calendar layout.
- Better visual distinction for inactive events.
- Keep click date → add event behavior.

---

## Phase 5 — Admin Sidebar Badges & Notification Counts

Modify:
- `src/components/DashboardSidebar.tsx`
- possibly `src/pages/admin/AdminOverview.tsx`

Add count badges beside sidebar items only when count is greater than zero:
- Verification: unverified students/instructors
- Course Approvals: pending content reviews
- Assignments: ungraded submissions
- Messages: unread messages
- Feedback: recent feedback count or total feedback count

Rules:
- Do not show `0`.
- Keep badges small and non-disruptive.
- Use existing tables only; no new notification table in this phase.
- Ensure message pages mark messages as read where already supported.

---

## Phase 6 — Chat UI Consistency

Modify:
- `src/pages/dashboard/StudentChat.tsx`
- `src/pages/instructor/TutorMessages.tsx`
- `src/pages/admin/AdminMessages.tsx`

Make all chat areas consistent:
- Same contact list style.
- Same mobile contact-selection flow.
- Same message bubble spacing.
- Same empty state.
- Same unread badges.
- Better header labels:
  - Student: Reach Out
  - Tutor: Reach Out
  - Admin: Messages
  - Super Admin: Message Monitor
- Remove older visible borders and apply official card shadows.

No new database changes are needed.

---

## Phase 7 — Mobile Responsiveness Pass

Audit and fix key pages for:
- 320px
- 360px
- 432px
- tablet
- desktop

Priority pages:
- Landing page
- Navbar mobile menu
- Footer
- Public Events
- Admin Dashboard
- Admin Curriculum
- Tutor Curriculum
- Tutor Lesson Plans
- Admin Lesson Plans
- Admin Students
- Admin Teachers
- Admin Batches
- Admin Schedule
- Admin Messages
- Student Chat

Fix:
- Horizontal overflow
- Too-wide tables
- Tiny touch targets
- Dialog overflow
- Calendar compression
- Sidebar/drawer spacing
- Button wrapping
- Card padding on small screens

---

## Phase 8 — Validation

After implementation:
- Run build/typecheck.
- Fix any TypeScript errors.
- Check that no protected route was broken.
- Verify lesson-plan pages load for tutor/admin.
- Verify curriculum fields save and reload.
- Verify PDF download still works.
- Verify events calendar works on public and admin pages.
- Verify sidebar counts do not show zero.
- Verify mobile layouts do not overflow.

## Expected files to modify

- `src/pages/admin/AdminCurriculum.tsx`
- `src/pages/instructor/TutorCurriculum.tsx`
- `src/pages/instructor/TutorLessonPlans.tsx`
- `src/pages/admin/AdminLessonPlans.tsx`
- `src/lib/lessonPlanPdf.ts`
- `src/components/DashboardSidebar.tsx`
- `src/pages/Index.tsx`
- `src/pages/Events.tsx`
- `src/pages/admin/AdminEvents.tsx`
- `src/pages/admin/AdminOverview.tsx`
- `src/pages/instructor/InstructorClassLog.tsx`
- `src/pages/dashboard/StudentChat.tsx`
- `src/pages/instructor/TutorMessages.tsx`
- `src/pages/admin/AdminMessages.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- minor styling cleanup in related admin/dashboard pages as needed

## Database changes

No new database migration is expected for this phase. The needed columns and lesson-plan tables already exist.
