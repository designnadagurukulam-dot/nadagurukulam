

# Nada Gurukulam — Complete Platform Redesign Plan

This is a very large request spanning 8 phases. I recommend implementing them sequentially, one phase per approval cycle, to keep changes manageable and testable.

---

## Phase 1: Auth System Redesign

### What changes
- **Login page** (`/login`): Add Student/Tutor tab selector with role-appropriate icons. Add subtle "Institution staff? Access admin portal" link at bottom.
- **New admin login** (`/admin-login`): Minimal centered card, email + password only, no public nav link.
- **Student registration** (`/register/student`): Expand from current ~6 fields to full 2-column form: DOB, gender, address/city/state/pincode, KYC doc type/number/upload, emergency contacts, terms checkbox.
- **Tutor registration** (`/register/tutor`): Expand to include DOB, gender, qualifications, years of experience, specialization, profile photo upload, department dropdown.
- **Pending Approval** (`/pending-approval`): Minor polish — show user's name, update copy to match spec.
- **Post-login routing**: Update to route student → `/dashboard/student`, instructor → `/dashboard/tutor`, admin → `/dashboard/admin`.

### Files to create
- `src/pages/AdminLogin.tsx`

### Files to edit
- `src/pages/Login.tsx` — add tab selector
- `src/pages/Register.tsx` — split into two full forms with all new fields
- `src/pages/PendingApproval.tsx` — minor copy update
- `src/App.tsx` — add `/admin-login` route, update student routes from `/dashboard` to `/dashboard/student`
- `src/components/RoleProtectedRoute.tsx` — update student path
- `src/components/DashboardSidebar.tsx` — update student nav paths
- `src/components/Navbar.tsx` — remove dashboard/admin links from public nav

### Route migration (breaking change)
All student dashboard routes change from `/dashboard/*` to `/dashboard/student/*`. All instructor routes change from `/dashboard/instructor/*` to `/dashboard/tutor/*`. This affects ~15 route definitions and all sidebar nav links.

---

## Phase 2: Database Schema Additions

### New columns on `profiles`
`date_of_birth`, `gender`, `address`, `city`, `state`, `pincode`, `kyc_document_type`, `kyc_document_number`, `kyc_document_url`, `emergency_contact_name`, `emergency_contact_phone`, `qualifications`, `years_of_experience`, `specialization` (note: `department` already exists).

### New tables
| Table | Purpose |
|---|---|
| `batches` | Groups of students under a course + instructor |
| `batch_enrollments` | Student-to-batch mapping |
| `live_classes` | Scheduled video classes with meeting links |
| `messages` | Tutor-student direct messaging |
| `feedback` | Anonymous student feedback to admin |

### Modified tables
- `curriculum_modules` — add `batch_id` column
- `curriculum_sections` — add `audio_url`, `pdf_url` columns
- `assignments` — add `video_url`, `external_link`, `batch_id` columns

### New storage buckets
- `curriculum-materials`, `kyc-documents`, `profile-avatars`

### RLS policies
Each new table gets appropriate policies using `is_super_or_admin()`, `has_role()`, and `auth.uid()` checks as detailed in the prompt.

### Realtime
Enable realtime on `messages` table for chat functionality.

---

## Phase 3: Global UI Theme Overhaul

### What changes
- **Color palette shift**: Current deep maroon + gold → deep navy/indigo + gold. This changes `--primary` from maroon (`358 68% 31%`) to navy (`231 72% 25%`).
- **Sidebar**: Navy background with gold text/accents instead of current light card background.
- **Typography**: Already using Playfair Display + Inter — just tighten sizes and add uppercase label styling.
- **Cards**: Update border-radius to 16px, refine shadows.
- **Buttons**: Update border-radius to 10px, add gold variant.
- **Forms**: Gold focus glow, uppercase labels.
- **Tables**: Navy header, alternating rows, gold hover border.

### Files to edit
- `src/index.css` — full CSS variable overhaul
- `tailwind.config.ts` — update extended colors if needed
- `src/components/DashboardSidebar.tsx` — navy background styling
- `src/components/DashboardLayout.tsx` — adjust for new sidebar
- Multiple dashboard pages — card/table styling updates

### Impact
This is a visual-only change but touches every page. The maroon-to-navy shift is significant and changes the entire brand feel.

---

## Phase 4: Student Dashboard Redesign

### New pages to create
| Page | Route |
|---|---|
| `StudentLiveClasses.tsx` | `/dashboard/student/live-classes` |
| `StudentChat.tsx` | `/dashboard/student/chat` |
| `StudentFeedback.tsx` | `/dashboard/student/feedback` |

### Pages to heavily rewrite
- `DashboardOverview.tsx` — new widget layout with batch info, upcoming classes, recent material
- `DashboardCurriculum.tsx` — split-panel layout filtered by batch
- `DashboardAssignments.tsx` — three tabs (Pending/Submitted/Graded), media attachments
- `DashboardProfile.tsx` — three-tab layout with all new fields

### Existing pages with minor updates
- `DashboardCertificates.tsx` — mostly unchanged
- `DashboardSchedule.tsx` — may merge into live classes

### Sidebar update
Student nav gets new items: Live Classes, Chat, Feedback. Remove Class Log and Projects (or keep if desired).

---

## Phase 5: Tutor Dashboard Redesign

### New pages to create
| Page | Route |
|---|---|
| `TutorOverview.tsx` | `/dashboard/tutor` |
| `TutorStudents.tsx` | `/dashboard/tutor/students` |
| `TutorCurriculum.tsx` | `/dashboard/tutor/curriculum` |
| `TutorLiveClasses.tsx` | `/dashboard/tutor/live-classes` |
| `TutorAssignments.tsx` | `/dashboard/tutor/assignments` |
| `TutorMessages.tsx` | `/dashboard/tutor/messages` |
| `TutorAnalytics.tsx` | `/dashboard/tutor/analytics` |
| `TutorProfile.tsx` | `/dashboard/tutor/profile` |

### Key new functionality
- **Curriculum permissions**: Tutor can create own modules but cannot edit admin-created ones (check `created_by` field).
- **Live class scheduling**: Form with batch selection, meeting link, platform choice.
- **Assignment creation**: Rich media attachments (PDF, video, audio, links).
- **Chat**: Real-time messaging with students using Supabase Realtime on `messages` table.

### Pages to remove/replace
All existing `src/pages/instructor/*` files get replaced with new `tutor/*` equivalents.

---

## Phase 6: Admin Dashboard Redesign

### New pages to create
| Page | Route |
|---|---|
| `AdminTutors.tsx` | `/dashboard/admin/tutors` |
| `AdminBatches.tsx` | `/dashboard/admin/batches` |
| `AdminLiveClasses.tsx` | `/dashboard/admin/live-classes` |
| `AdminFeedback.tsx` | `/dashboard/admin/feedback` |
| `AdminSettings.tsx` | `/dashboard/admin/settings` |

### Pages to rewrite
- `AdminOverview.tsx` — new stat layout with pending approvals, batches, live classes today
- `AdminStudents.tsx` — full profile drawer, batch assignment, CSV export
- `AdminCurriculum.tsx` — full CRUD with batch tagging, created-by labels
- `AdminUserVerification.tsx` — add KYC document preview in slide-in drawer

### Sidebar update
Admin nav gets new items: Tutors, Batches, Live Classes, Feedback, Settings. Restructured ordering per spec.

---

## Phase 7: Routing & Navigation Cleanup

### Route protection updates
- Student routes: `/dashboard/student/*` → `student` role only
- Tutor routes: `/dashboard/tutor/*` → `instructor` role only
- Admin routes: `/dashboard/admin/*` → `admin` or `super_admin`
- Verification: `/dashboard/admin/verification` → `super_admin` only
- All unverified users → `/pending-approval`

### Public nav cleanup
- Remove any dashboard/admin links from public navbar
- Show "Login" button or avatar + "Go to Dashboard" for logged-in users

---

## Phase 8: Audio Player Component

### Create
- `src/components/AudioPlayer.tsx` — reusable component using HTML5 `<audio>` with `useRef`
- Navy background, gold accents, play/pause, rewind/forward 10s, progress bar, volume control
- Props: `src`, `title`

---

## Implementation Order & Sizing

| Phase | Estimated Scope | Dependencies |
|---|---|---|
| Phase 2 (DB) | 1 migration, ~8 new tables/columns | None — do first |
| Phase 1 (Auth) | 5 files edit, 1 new file | Phase 2 (new profile columns) |
| Phase 3 (Theme) | CSS + sidebar overhaul | None |
| Phase 8 (Audio) | 1 component | None |
| Phase 4 (Student) | 3 new pages, 4 rewrites | Phase 2 (batches, live_classes, messages, feedback) |
| Phase 5 (Tutor) | 8 new pages | Phase 2 + Phase 8 |
| Phase 6 (Admin) | 5 new pages, 4 rewrites | Phase 2 |
| Phase 7 (Routing) | Route cleanup | All other phases |

### Recommended approach
I suggest implementing **Phase 2 (DB) + Phase 1 (Auth)** together as the first batch, since auth forms need the new profile columns. Then Phase 3 (Theme) + Phase 8 (Audio). Then Phases 4-6 (dashboards). Finally Phase 7 (routing cleanup).

### Important note on color palette change
The prompt requests changing from deep maroon to deep navy. This is a significant brand identity shift. The current palette (maroon #86191C + gold #D69D53) is well-established. Confirm this is intentional before proceeding.

### No external paid services needed
All features use built-in capabilities: Supabase Realtime for chat, HTML5 audio for player, Supabase Storage for files. Zero additional cost.

