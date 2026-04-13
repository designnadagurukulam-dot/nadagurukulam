

# Nada Gurukulam — Brand Theme Application Plan

## Summary
Replace the current Deep Navy + Gold palette with the original nadagurukulam.org **Deep Maroon (#7D1E24) + Saffron Gold (#C49A3C)** palette across all LMS/auth pages. Update fonts from Playfair Display/Inter to Cormorant Garamond/Nunito Sans.

---

## Scope
**Changed**: All dashboard, auth, and LMS pages (login, register, pending-approval, student/tutor/admin dashboards, modals, forms, tables, toasts, skeletons, empty states)  
**Unchanged**: Public pages (`/`, `/about`, `/courses`, `/faculty`, etc.)

---

## Implementation Steps

### Step 1 — Global CSS Variables & Fonts (`src/index.css`)
- Import Cormorant Garamond + Nunito Sans from Google Fonts
- Replace `:root` CSS variables: primary from navy `231 72% 25%` → maroon `355 60% 30%`, sidebar from `231 72% 18%` → `355 60% 20%`, accent to saffron gold `40 56% 50%`, background to cream `42 40% 96%`
- Update `.dark` block accordingly
- Replace body font-family to Nunito Sans, headings to Cormorant Garamond
- Update gradient utilities (`gradient-navy` → maroon gradient, gold gradients updated)
- Add global heading styles (h1-h4 sizes, colors)

### Step 2 — Tailwind Config (`tailwind.config.ts`)
- Add `brand` color map with all 13 hex values (#7D1E24, #5C1219, #A8343B, #C49A3C, #E2B95A, #F5E9CE, #FAF6EE, #F2EAD6, #EDE3CC, #1E1610, #3D2E22, #8C7B6B, #C4B5A5)
- Update fontFamily to Cormorant Garamond (serif) and Nunito Sans (sans)

### Step 3 — Sidebar (`DashboardSidebar.tsx`)
- Update sidebar to use deep maroon (`#5C1219`) background with gold text (`#E2B95A`)
- Active nav items: `bg-[#7D1E24]` with gold border-left and gold text
- Inactive: `text-[#C4B5A5]` with hover to gold
- User section: gold name, role badge `bg-[#C49A3C] text-[#5C1219]`
- Mobile hamburger bar: `bg-[#5C1219]`

### Step 4 — Login Page (`Login.tsx`)
- Left panel: `bg-[#5C1219]` with Cormorant Garamond institution name in `#E2B95A`
- Role tabs: active `bg-[#7D1E24] text-white`, inactive `bg-[#F2EAD6] text-[#8C7B6B]`
- Form inputs: border `#EDE3CC`, focus ring `#C49A3C`
- Links: gold accent color

### Step 5 — Register & Auth Pages (`Register.tsx`, `AdminLogin.tsx`, `LoginSelect.tsx`, `PendingApproval.tsx`)
- Apply same maroon/gold/cream palette as login page

### Step 6 — Dashboard Layout (`DashboardLayout.tsx`)
- Main content area: `bg-[#FAF6EE]`

### Step 7 — Dashboard Overview Pages (Student, Tutor, Admin)
- Welcome banner: `bg-[#7D1E24]` with gold text
- Stat cards: white with `border-[#EDE3CC]`, icon circles `bg-[#F5E9CE]` with gold icons, stat numbers in Cormorant Garamond `text-[#7D1E24]`
- Page titles: Cormorant Garamond in `#7D1E24`

### Step 8 — All Dashboard Sub-pages (~15 files)
Apply consistent styling to: StudentLiveClasses, StudentChat, StudentFeedback, DashboardAssignments, DashboardProfile, DashboardCurriculum, TutorLiveClasses, TutorMessages, TutorCurriculum, InstructorAssignments, InstructorStudents, AdminBatches, AdminFeedback, AdminLiveClasses, and remaining admin pages.

Key patterns applied uniformly:
- **Tables**: header `bg-[#5C1219] text-[#E2B95A]`, alternating rows cream/white
- **Tabs**: container `bg-[#F2EAD6]`, active `bg-[#7D1E24] text-white`
- **Badges**: verified=green, pending=amber, rejected=red, roles use brand maroon/gold
- **Buttons**: primary `bg-[#7D1E24]`, accent `bg-[#C49A3C]`, outline `border-[#7D1E24]`
- **Forms**: inputs with `border-[#EDE3CC]` and gold focus ring
- **Empty states**: gold icon + Cormorant heading + cream background
- **Skeletons**: `bg-[#F2EAD6]` animated pulse

### Step 9 — Toast Notifications
- Update sonner Toaster component styling: info toast with gold border on cream, error with red, success with green

### Step 10 — Skeleton Component (`skeleton.tsx`)
- Update base color to `bg-[#F2EAD6]`

---

## Files Modified (estimated ~25 files)
`src/index.css`, `tailwind.config.ts`, `src/components/DashboardSidebar.tsx`, `src/components/DashboardLayout.tsx`, `src/components/ui/skeleton.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/AdminLogin.tsx`, `src/pages/LoginSelect.tsx`, `src/pages/PendingApproval.tsx`, `src/pages/dashboard/DashboardOverview.tsx`, `src/pages/dashboard/StudentLiveClasses.tsx`, `src/pages/dashboard/StudentChat.tsx`, `src/pages/dashboard/StudentFeedback.tsx`, `src/pages/dashboard/DashboardAssignments.tsx`, `src/pages/dashboard/DashboardProfile.tsx`, `src/pages/dashboard/DashboardCurriculum.tsx`, `src/pages/instructor/InstructorOverview.tsx`, `src/pages/instructor/InstructorStudents.tsx`, `src/pages/instructor/InstructorAssignments.tsx`, `src/pages/instructor/TutorLiveClasses.tsx`, `src/pages/instructor/TutorMessages.tsx`, `src/pages/instructor/TutorCurriculum.tsx`, `src/pages/admin/AdminOverview.tsx`, `src/pages/admin/AdminBatches.tsx`, `src/pages/admin/AdminFeedback.tsx`, `src/pages/admin/AdminLiveClasses.tsx`

## Approach
Will implement in batches: globals first (Steps 1-3), then auth pages (Steps 4-5), then dashboards (Steps 6-8), then polish (Steps 9-10). Each batch will be verified for TypeScript compilation.

