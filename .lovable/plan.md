# Lesson Plans tab redesign (Instructor view)

Rebuild `src/pages/instructor/TutorLessonPlans.tsx` to match the SSSUHE Lesson Plan format. All admin-set data is read-only; only specific cells are instructor-editable.

## 1. Header table (read-only, one row, all from curriculum + allocation)

Single info table at the top with these fields:

| Field | Source |
|---|---|
| Academic Semester (Odd/Even) | derived from `curriculum_modules.semester` (odd → Odd Sem, even → Even Sem) |
| Academic Year | `subject_allocations.academic_year` for this instructor + module |
| Semester No. | `curriculum_modules.semester` |
| Program | `categories.name` joined via `curriculum_modules.program_id` (label changed from "Section" → "Program") |
| Course Code | `curriculum_modules.course_code` |
| Contact Hrs / Week | `curriculum_modules.teaching_hours` (fallback `periods`) |
| Course Name | `curriculum_modules.subject_name` |
| No. of Credits | `curriculum_modules.credits` |
| Instructor Name | `profiles.display_name` (current user) |
| Designation | `profiles.designation` (current user) |
| CIE Marks | `curriculum_modules.assessment_cie_marks` |
| SEE Marks | `curriculum_modules.assessment_see_marks` |
| Exam Hours | `curriculum_modules.exam_hours` |

Existing free-text inputs for academic_semester / section / contact_hours / total_periods are removed from the instructor UI — these come from admin data.

## 2. Four supplementary tables (under header)

All non-editable for instructor, except Content Delivery Methods.

1. **Prerequisites if any** — new admin field `curriculum_modules.prerequisites text`. Read-only here.
2. **Content Delivery Methods** — defaults to `curriculum_modules.pedagogy`. Instructor can override per lesson plan: store in `lesson_plans.content_delivery_methods text` (new column). Editable textarea, saved with header.
3. **Course Syllabus (As prescribed by SSSUHE)** — read-only list rendered from `curriculum_modules.description` + `curriculum_topics` (module → topics, grouped).
4. **Course Outcomes** — read-only list from `course_outcomes` rows (CO1..COn with description, RBT level, hours).

## 3. Lesson Plan grid (one row per period)

Columns:

| Column | Editable by instructor? | Source / behavior |
|---|---|---|
| Period | No | row index (1..total_periods) |
| Module Name | No | `curriculum_modules.module_name` for the selected topic's parent module (auto-filled when Topic picked) |
| Topic | **Yes** | dropdown of `curriculum_topics` rows belonging to that module (and/or `curriculum_sections.title`). On change, auto-fills Module Name + RBT |
| RBT Levels | No | from selected topic/section (`rbt_levels`) |
| Course Outcome Mapping | **Yes** | dropdown of `CO1..COn` (n = count of `course_outcomes` for this curriculum module) — replaces free-text Input |
| Actual Date | No | auto-populated from `class_logs` matching `instructor_id + curriculum_section_id/topic` (see §4) |
| Faculty Sign | No | display `profiles.display_name` once `actual_date` is present |
| Remarks | **Yes** | textarea (`faculty_remarks`) |

Mobile card view mirrors the same edit restrictions.

## 4. Actual Date auto-fill from Teaching Logs

Already partially wired (`class_logs` query exists). Tighten the match:
- Lookup `class_logs` where `instructor_id = user.id` AND (`curriculum_section_id = row.curriculum_section_id` OR `topic_covered = row.topic_title`).
- If a confirmed log exists, lock `actual_date` to that date (no manual input).
- Super Admin override is handled in `AdminLessonPlans.tsx` (out of scope here — already exists).

## 5. Database migration

Add the missing fields:

```sql
ALTER TABLE public.curriculum_modules
  ADD COLUMN IF NOT EXISTS prerequisites text;

ALTER TABLE public.lesson_plans
  ADD COLUMN IF NOT EXISTS content_delivery_methods text;
```

(All other header fields already exist on `curriculum_modules` / `profiles` / `subject_allocations`.)

Admin-side UI to set `prerequisites` will be added to `AdminCurriculum` form (one-line change: add a textarea bound to the new column).

## 6. Files touched

- `supabase/migrations/<new>.sql` — two ALTERs above
- `src/pages/instructor/TutorLessonPlans.tsx` — full rewrite of header + 4 tables + restricted grid
- `src/pages/admin/AdminCurriculum.tsx` (or equivalent module editor) — add Prerequisites field
- `src/lib/lessonPlanPdf.ts` — mirror the new header fields + 4 tables in the PDF export
- `src/integrations/supabase/types.ts` — auto-regenerated after migration

## Out of scope (separate request)

- Admin override of Actual Date and other locked columns (Super Admin editor lives in `AdminLessonPlans.tsx`; will address when you reach the Teaching Logs section).
- Any changes to how `class_logs` are created by the instructor.
