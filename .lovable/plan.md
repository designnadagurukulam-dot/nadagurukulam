

# Three Fixes: Assignment Popup, PDF Upload, and Tutor Overview

## 1. Student Assignments — Open as Popup with Submit Button (`DashboardAssignments.tsx`)

**Current**: Assignment cards are listed inline with a Submit button on each card.

**Change**: When a student clicks an assignment card, open a **detail popup dialog** showing full assignment info (title, course, description, due date, attached PDF/video/link) with a **Submit button** at the bottom. Remove the inline Submit button from the card list — the card itself becomes clickable.

- Add a new state `selectedAssignment` to track which assignment detail popup is open
- Make each assignment card clickable (`onClick` → open detail dialog)
- New dialog shows: title, course name, description, due date badge, resource buttons (PDF/Video/Link), and grade info if graded
- Submit button inside the detail dialog opens the existing submit form (or shows submit form inline within the same dialog)
- Keep the existing submit dialog logic but trigger it from within the detail popup

## 2. PDF File Upload in Create Course (`CreateCourse.tsx`)

**Current**: When lesson type is "pdf", it shows a text input for "PDF file URL" (line 560-566).

**Change**: Replace the URL input with a **file upload input** that uploads the PDF to the `course-pdfs` storage bucket and stores the resulting path in `les.pdf_url`.

- Replace the `<Input>` for pdf_url with `<Input type="file" accept=".pdf">`
- On file select, upload to `course-pdfs` bucket under `lessons/{userId}/{timestamp}_{filename}`
- Get the public URL and store it in the lesson's `pdf_url` field
- Show upload progress/status indicator
- If a PDF is already uploaded, show the filename with a remove option

## 3. Tutor Overview — Show Allocated Courses (`InstructorOverview.tsx`)

**Current**: Shows stat cards, today's schedule, teaching activity chart, recent submissions, and a CTA.

**Change**: Add a new **"My Allocated Subjects"** section that fetches from `subject_allocations` table joined with `curriculum_modules` to show the tutor's allocated subjects (semester, subject name, course code).

- Query `subject_allocations` where `instructor_id = user.id`, join with `curriculum_modules` for subject details
- Display as styled cards with semester badge, subject name, and course code
- Place between the stat cards and the middle row

## 4. Tutor Analytics — Remove Two Charts (`InstructorAnalytics.tsx`)

**Current**: Shows 3 stat cards + Enrollment Trends chart + Students per Course chart.

**Change**: Remove the entire `grid grid-cols-1 lg:grid-cols-2` section (lines 80-120) containing both "Enrollment Trends" and "Students per Course" charts. Keep only the stat cards and header.

## Files to Edit

| File | Change |
|---|---|
| `src/pages/dashboard/DashboardAssignments.tsx` | Add assignment detail popup with submit button |
| `src/pages/instructor/CreateCourse.tsx` | Replace PDF URL input with file upload |
| `src/pages/instructor/InstructorOverview.tsx` | Add "My Allocated Subjects" section |
| `src/pages/instructor/InstructorAnalytics.tsx` | Remove enrollment trends and students per course charts |

