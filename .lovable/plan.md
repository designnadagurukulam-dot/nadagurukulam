

# Premium Brand UI — All Remaining Dashboard Pages

## Summary
Apply the established premium Nada Gurukulam brand system (maroon/gold/cream cards, serif headings, branded tables, gold icon circles) to all 17 remaining Admin pages + 2 remaining Tutor pages (TutorCurriculum, CreateCourse). Every page gets the same visual treatment already applied to Student and Tutor overview/sub-pages.

## Design Tokens (already established, applied consistently)
- **Page wrapper**: `space-y-6 pt-2`
- **Titles**: `font-serif text-2xl font-semibold text-[#7D1E24]` + `w-12 h-0.5 bg-[#C49A3C] mt-1`
- **Cards**: `bg-white rounded-2xl border border-[#EDE3CC] shadow-[0_2px_24px_rgba(125,30,36,0.06)] p-6`
- **Tables**: header `bg-[#5C1219] text-[#E2B95A] text-[11px] uppercase tracking-widest`, rows alternating `bg-white`/`bg-[#FAF6EE]`
- **Buttons**: primary `bg-[#7D1E24] hover:bg-[#5C1219] text-white rounded-xl`, accent `bg-[#C49A3C] text-[#3D2E22] rounded-xl`
- **Inputs/Selects**: `border-[#EDE3CC] rounded-xl focus:border-[#C49A3C]`
- **Badges**: contextual colors on pale backgrounds
- **Empty states**: gold icon in `bg-[#F5E9CE]` circle + serif heading
- **Stat cards**: white card, gold icon circle `bg-[#F5E9CE]`, number `font-serif text-4xl text-[#7D1E24]`
- **Dialogs**: title `font-serif text-[#7D1E24]`, brand-styled inputs
- **Labels**: `text-[11px] uppercase tracking-widest text-[#8C7B6B] font-semibold`
- **Lucide icons**: generous use, `size={15-18}` for nav/actions, enriching visual density

## Files to Update (19 files across 4 batches)

### Batch 3 — Admin Part 1 (6 files)
1. **AdminBatches.tsx** (303 lines) — Brand table, create/edit/enroll dialogs, stat summary row
2. **AdminStudents.tsx** (234 lines) — Brand user cards, role badges, export buttons, search/filter
3. **AdminFeedback.tsx** (155 lines) — Brand feedback cards, gold star display, filter selects
4. **AdminLiveClasses.tsx** (146 lines) — Brand tabs, table, live badges, join buttons
5. **AdminApprovals.tsx** (124 lines) — Brand approval cards, approve/reject styled buttons
6. **AdminCourses.tsx** (115 lines) — Brand course table, status badges, search bar

### Batch 4 — Admin Part 2 (11 files)
7. **AdminCurriculum.tsx** (415 lines) — Brand tabs, accordion, section management, YouTube embeds
8. **AdminActivityLog.tsx** (225 lines) — Brand table with pagination, action badges
9. **AdminAnalytics.tsx** (215 lines) — Brand stat cards, recharts with brand colors (#7D1E24, #C49A3C)
10. **AdminSchedule.tsx** (259 lines) — Brand schedule table, create dialog
11. **AdminEvents.tsx** (233 lines) — Brand event cards, create/edit dialog
12. **AdminJobs.tsx** (236 lines) — Brand tabs (Jobs/Volunteers), job cards, create dialog
13. **AdminCoupons.tsx** (161 lines) — Brand coupon cards, create form
14. **AdminInquiries.tsx** (179 lines) — Brand inquiry table, status selects
15. **AdminCategories.tsx** (114 lines) — Brand category list, inline edit
16. **AdminSubjectAllocation.tsx** (208 lines) — Brand allocation table, create dialog
17. **AdminUserVerification.tsx** (226 lines) — Brand verification table, role management

### Batch 5 — Remaining Tutor (2 files)
18. **TutorCurriculum.tsx** (311 lines) — Brand accordion, create module dialog, topic cards
19. **CreateCourse.tsx** (633 lines) — Brand multi-step wizard, step indicators in maroon/gold

## Visual Enhancements Beyond Basic Branding
- Add more Lucide icons throughout (e.g. `Sparkles`, `Trophy`, `Music`, `GraduationCap`, `Palette`, `Globe`) to make pages visually rich
- Stat summary rows at top of data-heavy pages (AdminStudents, AdminBatches, AdminCourses)
- Gold-accented section dividers between content blocks
- Animated entrance with `motion.div` on cards
- Recharts in AdminAnalytics updated to use brand palette (#7D1E24, #C49A3C, #E2B95A, #5C1219)
- Empty states with decorative icons and inviting copy
- Hover effects on table rows: `hover:bg-[#FAF6EE]` transition

## Implementation
Process in 3 batches (Batch 3, 4, 5), running `npx tsc --noEmit` after each to verify zero errors. Presentation-layer only — all data fetching, mutations, and business logic preserved exactly.

