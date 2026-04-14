

# Mobile-First Dashboard Redesign — App-Like Feel

## Summary

Overhaul all student dashboard pages to be 100% mobile responsive with proper alignment, touch-friendly sizing, and a native app-like feel on the 432px viewport. Also polish the DashboardLayout top bar and sidebar for mobile.

## Files to Change

### 1. `src/components/DashboardLayout.tsx` — Mobile-optimized top bar
- Reduce mobile padding: `pt-14` → `pt-12`, tighter `px-3`
- Show a compact greeting with smaller text on mobile (`text-xl` instead of `text-2xl`)
- Add a mobile search icon button instead of hiding search entirely
- Make bell button more touch-friendly (44px tap target)
- Reduce gap between greeting and content

### 2. `src/components/DashboardSidebar.tsx` — Touch-optimized mobile drawer
- Increase hamburger button tap target to 44x44px
- Make mobile sidebar wider: `w-72` → `w-[85vw] max-w-80`
- Increase nav item touch targets: `py-2.5` → `py-3`
- Add safe-area padding for notched phones (`pb-safe`)

### 3. `src/pages/dashboard/DashboardOverview.tsx` — Mobile stat cards + layout
- Stat cards: reduce padding on mobile (`p-3` vs `p-5`), smaller icon circles, `text-2xl` font for values
- Study Activity chart: reduce height to 100px on mobile
- Upcoming Classes: stack elements vertically on small screens, ensure truncation
- Assignment table: convert to card layout on mobile instead of `<table>` (tables overflow on 432px)
- Quick action CTA: full-width stacked layout on mobile

### 4. `src/pages/dashboard/DashboardCurriculum.tsx` — Mobile curriculum polish
- Mobile chapter strip: increase pill sizes for touch targets (min 44px height)
- Filter pills: use `gap-2` and allow wrapping properly, reduce pill text size on mobile
- Topic cards: reduce padding on mobile (`p-3` vs `p-5`), tighter margins
- YouTube embeds: ensure proper aspect ratio on narrow screens
- Chapter header: smaller text on mobile

### 5. `src/pages/dashboard/StudentChat.tsx` — Full-screen mobile chat
- Mobile chat should take full viewport height with proper keyboard handling
- Larger message input area with bigger send button (44px)
- Tutor list cards: increase tap targets
- Message bubbles: `max-w-[85%]` on mobile for better readability
- Back button: bigger, more prominent on mobile

### 6. `src/pages/dashboard/StudentLiveClasses.tsx` — Card alignment on mobile
- Class cards: single column, full-width on mobile
- Badges and buttons: wrap properly, no overflow
- Join button: full-width on mobile
- Date/time info: reorganize for vertical layout on small screens

### 7. `src/pages/dashboard/DashboardAssignments.tsx` — Mobile assignment cards
- Tab triggers: smaller text, proper wrapping on mobile
- Assignment cards: stack title, due date, and action button vertically on mobile
- Submit dialog: full-width on mobile, proper padding
- File input: styled for mobile with clear tap target

### 8. `src/pages/dashboard/DashboardCourses.tsx` — Single-column mobile grid
- Force `grid-cols-1` on mobile (already works), ensure card image height is proportional
- Progress bar: wider on mobile for visibility
- Instructor/duration badges: wrap instead of overflow

### 9. `src/pages/dashboard/DashboardProfile.tsx` — Mobile form layout
- Form fields: full-width single-column on mobile
- Tab triggers: horizontal scroll if too many tabs
- Save button: sticky at bottom on mobile for easy access
- Input fields: proper 44px height for touch

### 10. `src/pages/dashboard/StudentFeedback.tsx` — Mobile feedback form
- Star rating: larger stars on mobile (touch-friendly 44px targets)
- Form inputs: full-width, proper spacing
- Submit button: full-width on mobile

### 11. `src/pages/dashboard/DashboardCertificates.tsx` — Mobile certificate cards
- Cards: full-width, vertical layout on mobile
- Buttons: full-width on mobile

### 12. `src/pages/dashboard/DashboardSchedule.tsx` — Mobile schedule cards
- Timeline items: adjust padding and text sizes for narrow screens

## Key Mobile Patterns Applied Everywhere

| Pattern | Implementation |
|---|---|
| Touch targets | Min 44x44px for all interactive elements |
| Text scaling | `text-lg`/`text-xl` headings on mobile vs `text-2xl` desktop |
| Padding | `p-3` mobile, `p-5` desktop using responsive classes |
| Cards | Full-width, no horizontal overflow |
| Tables | Convert to card/list layout on mobile |
| Buttons | Full-width CTAs on mobile |
| Spacing | Tighter `gap-2`/`space-y-3` on mobile vs `gap-4`/`space-y-6` desktop |

