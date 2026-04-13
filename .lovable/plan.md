

# Premium Dashboard UI Redesign

## Summary
Redesign all three dashboard overview pages (Student, Tutor, Admin) to use a modern, airy, card-based layout with a top greeting bar, study activity chart, upcoming schedule panel, curriculum topic cards, and assignment table. Also add a certificate promo card to the sidebar and refine the DashboardLayout top bar pattern.

## Scope
- 5 files modified: `DashboardSidebar.tsx`, `DashboardLayout.tsx`, `DashboardOverview.tsx`, `InstructorOverview.tsx`, `AdminOverview.tsx`
- 1 new dependency: `recharts` (already likely installed, will verify)

## Changes

### 1. DashboardSidebar — Add Certificate Promo Card
- Insert a promotional card between nav items and logout section
- Gold-bordered card with `Award` icon, "Earn Your Certificate!" heading
- Only shown for student role, when sidebar is not collapsed
- Reduce nav icon sizes to `size={15}` for consistency

### 2. DashboardLayout — Add Top Greeting Bar
- Create an inline top bar inside the main content area (not a fixed header)
- Left side: time-based greeting ("Good Morning/Afternoon/Evening") + user name with gold underline accent
- Right side: search input (decorative/placeholder) + notification bell icon
- Uses `useAuth()` for profile data
- Renders above `{children}` in the layout

### 3. Student DashboardOverview — Full Redesign
Replace the current welcome-banner + stats + lists layout with:
- **Stat cards row** (3-4 cards): white cards with `border-[#EDE3CC]`, subtle shadow, icon in gold circle (`bg-[#F5E9CE]`), number in Cormorant Garamond `text-[#7D1E24]`, label in warm grey uppercase
- **Middle row** (2-column grid):
  - Left: **Study Activity bar chart** using `recharts` `BarChart` — 6 day bars, today's bar in `#7D1E24`, others in `#C49A3C`, inactive in `#EDE3CC`, no grid/axes, 100px height. Data sourced from `lesson_progress` or placeholder
  - Right: **Upcoming Classes** list with colored left border, instructor + platform info, LIVE indicator, join button
- **Curriculum topic cards** (3-column grid): icon, title, media count, progress bar with maroon fill on parchment track
- **Assignments table**: maroon header row (`bg-[#5C1219] text-[#E2B95A]`), alternating cream/white rows, status badges (Overdue=red, Due Soon=amber, On Track=green)
- Remove the emoji from greeting, use clean text only

### 4. Tutor InstructorOverview — Matching Redesign
Same layout patterns as student but with tutor-specific content:
- **Stat cards**: Total Students, Upcoming Classes, Ungraded Submissions, Active Batches
- **Middle row**: Teaching activity chart + today's schedule
- **Recent submissions** as a styled table instead of card list
- **Quick action card**: Schedule a live class

### 5. Admin AdminOverview — Matching Redesign
Same layout patterns:
- **Stat cards** (4x2 grid): 8 stats with consistent card styling (gold icon circles, Cormorant numbers)
- **Middle row**: Platform activity chart + quick actions as styled grid buttons
- **Recent courses** as a styled table with maroon header
- **Activity log** section with consistent styling

### Design Patterns Applied Uniformly
- **Section headings**: Cormorant Garamond, `text-[#7D1E24]`, with gold `w-12 h-0.5 bg-[#C49A3C]` underline, optional "See All" link
- **Card containers**: `bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)]`
- **Stat numbers**: `font-['Cormorant_Garamond'] text-4xl font-bold text-[#7D1E24]`
- **Icon circles**: `w-10 h-10 rounded-full bg-[#F5E9CE]` with gold icons
- **Empty states**: gold icon + Cormorant heading on cream background

### Technical Notes
- Will verify `recharts` is installed; add if not
- Top bar greeting uses `new Date().getHours()` for time-based message
- All existing data fetching logic preserved; only presentation layer changes
- Motion animations kept but simplified

