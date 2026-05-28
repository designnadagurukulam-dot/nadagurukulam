# Instructor Courses & Curriculum — restructure

## 1. Fix: allocated curriculum not showing for instructor

**Problem**: `TutorCurriculum.tsx` currently decides "my modules" by matching `curriculum_modules.batch_id` against batches where the instructor is the batch's `instructor_id`. Subject allocations made by Super Admin live in the `subject_allocations` table (`instructor_id` ↔ `curriculum_module_id`) and are never read here, so allocated subjects don't appear.

**Fix**:
- Query `subject_allocations` for the logged-in instructor, get the allocated `curriculum_module_id` set.
- "My Curriculum" = union of: modules from that allocation set + modules whose `instructor_id` already equals the user + modules tied to a batch they instruct.
- Same change applied wherever the instructor's curriculum is listed (Courses tab "My Curriculum" card, Lesson Plans already uses `subject_allocations` correctly — keep as reference).

## 2. Sidebar + entry-point consolidation

- Remove the "Update Curriculum" item from `DashboardSidebar` for instructors.
- `My Courses & Curriculum` page becomes the single hub:
  - When there are **no courses**, keep the current empty-state card with the central "Create Course" CTA.
  - When there **are courses**, move "Create Course" to the **top-right** of the page header.
  - "Create Course" navigates to the existing `/dashboard/tutor/create` route, which keeps its back button to return here.
- The "My Curriculum" tab on this page becomes the place to manage allocated curriculum (today it lives at `/dashboard/tutor/curriculum`). The TutorCurriculum view is embedded as that tab's content; the standalone route can stay reachable but is no longer linked from the sidebar.

## 3. Simplify the Create Course flow

In `CreateCourse.tsx` step "Details":

- **Remove** the "New course vs Add to existing curriculum" block.
- **Remove** the "Course Placement" (semester/subject pickers) block.
- Course is always created as instructor extra-learning material (`instructor_id = user.id`, not linked to a curriculum module).

New **Course Details** fields:
- Course title
- Course outcomes (repeatable list — stored as `course_outcomes` rows attached to the new course / or a `text[]` on the course; use a simple textarea list for v1)
- Description
- Total hours (number)

**Next → Modules** step, for each module:
- Module title
- Teaching outcomes (textarea list)
- Description
- Hours — validated so `sum(module hours) ≤ course total hours`; show inline error and disable Next when exceeded.

Within each module, **Add Topic** collects:
- Topic name
- Description
- Material type: Video / Audio / Document / Text (drives which upload/url input shows — reuse existing lesson_type handling, extend with `audio`).

**Add Module** button after every module. **Next → Review → Submit for Review** (unchanged submission pipeline; status stays `pending`).

## 4. Add to existing curriculum from inside Courses

Inside the "My Curriculum" tab (the embedded TutorCurriculum):
- Per allocated subject (curriculum_module), add an **ADD MODULE** button — instructor creates an additional sub-module under that subject.
- Each module keeps its existing **Add Topic** action.
- **Visual distinction**: anything created by the instructor (vs. created by admin) shows a gold left-border ribbon + small "Added by you" badge, while admin-original items keep the maroon ribbon. Detection:
  - `curriculum_sections.created_by = auth.uid()` → instructor-added topic.
  - `curriculum_modules.created_by = auth.uid()` → instructor-added module (requires adding a `created_by uuid` column to `curriculum_modules`, default null, backfilled null = admin).
- **Edit/Delete** controls are only enabled on rows the instructor created. Admin-created rows are read-only for the instructor (UI hides edit/delete buttons; RLS already permits writes but we enforce in UI for now and tighten RLS later if needed).

## Technical notes

- **DB migration**: add `created_by uuid` to `public.curriculum_modules` (nullable). No RLS change required for this step.
- **Files touched**:
  - `src/components/DashboardSidebar.tsx` — remove "Update Curriculum" entry.
  - `src/pages/instructor/InstructorCourses.tsx` — top-right Create button when list non-empty; embed TutorCurriculum into the "My Curriculum" tab; fix allocated-curriculum query.
  - `src/pages/instructor/TutorCurriculum.tsx` — include `subject_allocations` in "my modules" logic; render per-module "Add Module" button; color-code instructor-vs-admin items; gate edit/delete by `created_by`.
  - `src/pages/instructor/CreateCourse.tsx` — drop placement/type sections; add course outcomes + total hours fields; per-module teaching outcomes + hours with sum-validation; extend topic types to include audio.
- **Out of scope** (call out, do not build): tightening RLS so instructors literally cannot mutate admin curriculum rows server-side; richer drag/drop reorder of new modules.
