

## Curriculum System — 8-Semester Syllabus with Educator Content Management

### Overview

Build a structured curriculum system based on the uploaded BPA Carnatic Vocal syllabus (8 semesters). Educators can enrich modules with sections containing YouTube videos and text. Students access the curriculum from their dashboard.

### Database Schema

Two new tables:

```text
curriculum_modules
├── id (uuid PK)
├── semester (int, 1-8)
├── subject_name (text) — e.g. "Carnatic Compositions I"
├── course_code (text) — e.g. "BCVP210"
├── module_name (text) — e.g. "Svarajathi - Any two"
├── description (text, nullable)
├── hours (int, nullable)
├── sort_order (int)
├── created_at, updated_at

curriculum_sections
├── id (uuid PK)
├── module_id (uuid FK → curriculum_modules)
├── title (text)
├── content_type (text: 'youtube' | 'text')
├── youtube_url (text, nullable)
├── text_content (text, nullable)
├── sort_order (int)
├── created_by (uuid, nullable)
├── created_at, updated_at
```

**RLS policies:**
- `curriculum_modules`: Anyone can SELECT; admins can INSERT/UPDATE/DELETE
- `curriculum_sections`: Enrolled students + admins + instructors can SELECT; admins + instructors can INSERT/UPDATE/DELETE

### Seed Data

Insert all 8 semesters of syllabus data from the uploaded DOCX into `curriculum_modules` via a migration. This covers ~60-70 module rows across subjects like:
- Sem 1: Foundation Course in Carnatic Music (BCVP110), History of Indian Music (BCVT130)
- Sem 2: Carnatic Compositions I (BCVP210), Theory of Indian Music (BCVT230)
- Sem 3-8: Continuing courses in Compositions, Theory, Manodharma Sangeetha, Samudaya Kriti

### New Pages & Components

**1. Public Curriculum Page (`/curriculum`)**
- 8 semester tabs across the top
- Each tab shows subjects grouped as cards
- Each subject card expands to show modules with descriptions and hours
- Accessible from main navbar

**2. Educator Curriculum Manager (`/dashboard/admin/curriculum` and `/dashboard/instructor/curriculum`)**
- Same semester tabs + subject/module drill-down
- For each module: list existing sections, add new section (title + YouTube URL or text content)
- Inline YouTube embed preview when adding
- Edit/delete sections

**3. Student Curriculum Dashboard (`/dashboard/curriculum`)**
- Semester tabs showing their curriculum
- Click into any module to see sections (embedded YouTube videos, text content)
- Similar to LessonPlayer but for curriculum content

### Routing & Navigation Changes

| Route | Role | Component |
|-------|------|-----------|
| `/curriculum` | Public | CurriculumPage |
| `/dashboard/curriculum` | Student | StudentCurriculum |
| `/dashboard/admin/curriculum` | Admin | AdminCurriculum |
| `/dashboard/instructor/curriculum` | Instructor | InstructorCurriculum |

- Add "Curriculum" to main navbar
- Add "Curriculum" to student, instructor, and admin sidebar nav

### Technical Details

- Semester tabs use existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` components
- YouTube embed reuses the existing `getYouTubeId` helper from LessonPlayer
- Sections are fetched via Supabase joins: `curriculum_modules` → `curriculum_sections`
- Admin/Instructor share the same management component (role check determines access)

### Files to Create/Edit

- **Create**: Migration SQL (schema + seed data)
- **Create**: `src/pages/Curriculum.tsx` — public page
- **Create**: `src/pages/dashboard/DashboardCurriculum.tsx` — student view
- **Create**: `src/pages/admin/AdminCurriculum.tsx` — admin/instructor management
- **Edit**: `src/App.tsx` — add routes
- **Edit**: `src/components/Navbar.tsx` — add Curriculum link
- **Edit**: `src/components/DashboardSidebar.tsx` — add Curriculum to all three nav arrays

