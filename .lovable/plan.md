

# UI Enhancement & Chat Integration Plan

## Summary
Four areas of work: (1) Unify chat functionality across all dashboards, (2) Redesign Events page with calendar-style UI, (3) Polish landing page styling and alignment, (4) Comprehensive mobile responsiveness fixes across all public pages and menus.

---

## Changes

### 1. Chat System — Add to Tutor & Admin Dashboards

**Current state**: StudentChat (Reach Out) is fully functional. TutorMessages has a similar but separate implementation. AdminMessages is read-only for super_admin only.

**Changes**:
- **TutorMessages.tsx**: Upgrade to match StudentChat's UI — add search bar, unread badge indicators, empty state illustrations, mobile-responsive stacked layout (list → thread view on tap)
- **AdminMessages.tsx**: Allow regular admins (not just super_admin) to send messages to tutors and students — add a "New Message" button with staff/student picker. Super admin keeps read-only monitoring mode. Add mobile stacking for thread panels.
- **DashboardSidebar.tsx**: Rename tutor "Messages" to "Reach Out" for consistency across roles. Add "Messages" link for admin role (not just super_admin).
- **App.tsx**: Update admin messages route to allow both `admin` and `super_admin` roles.

### 2. Events Page — Calendar-Style UI Redesign

**Current state**: Simple list of event cards with image + metadata.

**Changes to `Events.tsx`**:
- Add a visual **monthly calendar grid** at the top showing event dates highlighted with gold dots
- Use a two-panel layout: left side shows a compact calendar (using the existing `Calendar` component from shadcn), right side shows event cards for the selected date or "all upcoming"
- Each event card redesigned as a **calendar-style card**: large date badge (day number + month) on the left, event details on the right, with a colored left border (gold for upcoming, muted for past)
- Add month navigation arrows and "Today" button
- Past events shown in a collapsible "Past Events" accordion instead of a separate section
- Mobile: calendar grid collapses to a horizontal scrolling date strip

### 3. Landing Page — UI Polish & Color Theme Refinement

**Changes to `Index.tsx`**:
- **Hero**: Increase contrast on subtitle text (from `/50` to `/70` opacity). Add subtle golden border glow around the logo badge.
- **Founder section**: Tighter spacing on mobile, ensure image doesn't overflow on small screens
- **Features cards**: Add a subtle gradient background to the section (cream → white → cream) for visual separation
- **Course carousel**: Add manual swipe/drag support on mobile (currently auto-scroll only)
- **Stats section**: Ensure numbers are legible on all screen sizes — increase text size on mobile
- **Faculty strip**: Increase portrait sizes on mobile for better visibility
- **CTA section**: Add a secondary "Explore Courses" link below the primary button
- **Testimonials**: Add left/right arrow buttons for manual navigation alongside dots

**Changes to `index.css`**:
- Refine `--secondary` to be actual gold (`38 55% 50%`) instead of pale cream for better visual impact on buttons and badges
- Add a `.calendar-date-badge` utility class for the Events calendar cards

### 4. Mobile Responsiveness — Comprehensive Fixes

**Navbar.tsx**:
- Add safe area padding for notched phones (`env(safe-area-inset-top)`)
- Ensure mobile menu items have 44px minimum touch targets (currently `py-4` = good)
- Add a subtle backdrop overlay behind mobile menu

**Footer.tsx**:
- Stack social icons in a 2-row grid on very small screens (< 375px)
- Add bottom safe area padding for home indicator

**Index.tsx** (mobile fixes):
- Hero text: cap at `text-3xl` on 360px screens using `min()` or smaller breakpoint
- Campus bento grid: single column on mobile instead of 2-col
- Marquee: reduce speed on mobile for readability

**Events.tsx** (mobile):
- Calendar strip instead of full grid on small screens
- Event cards: full-width single column with adequate padding

**DashboardSidebar.tsx**:
- Ensure sidebar overlay is full-screen with no scroll leak
- Add swipe-to-close gesture hint on mobile

**General** (across all public pages):
- Audit all `container mx-auto px-4` sections for consistent horizontal padding
- Ensure no horizontal overflow on 320px viewport

---

## Files Modified
1. `src/pages/Events.tsx` — Complete calendar-style redesign
2. `src/pages/Index.tsx` — UI polish, mobile fixes, secondary color usage
3. `src/index.css` — Secondary color refinement, calendar utilities, mobile safe areas
4. `src/components/Navbar.tsx` — Mobile menu polish
5. `src/components/Footer.tsx` — Mobile grid fixes
6. `src/pages/instructor/TutorMessages.tsx` — Upgraded chat UI matching StudentChat
7. `src/pages/admin/AdminMessages.tsx` — Admin messaging capability + mobile responsive
8. `src/components/DashboardSidebar.tsx` — Label consistency, admin messages access
9. `src/App.tsx` — Route permission update for admin messages

## No Database Migrations Required
All chat tables and RLS policies already exist.

