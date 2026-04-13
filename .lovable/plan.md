

# Premium UI Redesign — All Dashboard Sub-Pages

## Summary
Apply the same premium card-based UI styling from the redesigned Overview pages to all remaining dashboard sub-pages across Student (9 pages), Tutor (6 pages), and Admin (12 pages). This is a presentation-layer-only update — no data fetching logic changes.

## Design System Applied Uniformly

Every sub-page will use these exact patterns from the Overview:

- **Page wrapper**: `space-y-6 pt-2` (remove old `pt-12 lg:pt-0` since TopBar in layout handles spacing)
- **Page title**: `font-serif text-2xl font-semibold text-brand-primary` with gold underline `w-12 h-0.5 bg-brand-gold mt-1`
- **Page subtitle**: `text-brand-warm-grey text-sm`
- **Card containers**: `bg-white rounded-2xl border border-brand-parchment shadow-[0_2px_24px_rgba(125,30,36,0.06)]`
- **Tabs**: container `bg-brand-cream-dark rounded-xl p-1`, active `bg-brand-primary text-white rounded-lg`, inactive `text-brand-warm-grey`
- **Tables**: header `bg-[#5C1219] text-[#E2B95A] text-[11px] uppercase tracking-widest`, alternating `bg-white`/`bg-brand-cream` rows, cells `text-brand-charcoal-mid text-[14px]`
- **Buttons**: primary `bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl`, accent `bg-brand-gold text-brand-charcoal rounded-xl`, outline `border-2 border-brand-primary text-brand-primary rounded-xl`
- **Badges**: verified=green-50, pending=amber-50, overdue=red-50, role badges use brand maroon/gold
- **Form inputs**: `border-brand-parchment rounded-xl focus:border-brand-gold focus:ring-brand-gold/20`
- **Labels**: `text-[11px] uppercase tracking-widest text-brand-warm-grey font-semibold`
- **Empty states**: gold icon in `bg-brand-gold-pale` circle, `font-serif text-brand-primary` heading, `text-brand-warm-grey` description
- **Skeletons**: `rounded-2xl` (already updated globally)
- **Dialogs**: title `font-serif text-brand-primary`, content with brand input styling
- **Avatar circles**: `bg-brand-gold-pale text-brand-primary font-bold`

---

## Files to Update (27 files)

### Student Dashboard (9 files)
1. `DashboardAssignments.tsx` — Brand cards, tabs, badges, submit dialog
2. `StudentLiveClasses.tsx` — Brand cards, tabs, live badge, join button
3. `StudentChat.tsx` — Brand tutor list, chat bubbles (sent=`bg-brand-primary`, received=`bg-brand-cream-dark`), input styling
4. `StudentFeedback.tsx` — Brand form card, star rating in gold, inputs, submit button
5. `DashboardCurriculum.tsx` — Brand tabs, accordion, section cards, YouTube embed wrapper
6. `DashboardProfile.tsx` — Brand avatar card with maroon header strip, tabs, form fields
7. `DashboardCourses.tsx` — Brand course cards with progress bars
8. `DashboardSchedule.tsx` — Brand schedule cards with type badges
9. `DashboardCertificates.tsx` — Brand certificate cards with award icon

### Tutor Dashboard (6 files)
10. `InstructorAssignments.tsx` — Brand cards, create dialog, grade dialog, tabs
11. `InstructorStudents.tsx` — Brand student cards/table, search input, batch filter
12. `TutorLiveClasses.tsx` — Brand cards, create dialog, live indicator, tabs
13. `TutorMessages.tsx` — Brand student list, chat bubbles, input (same pattern as StudentChat)
14. `TutorCurriculum.tsx` — Brand accordion, create module dialog, section cards
15. `InstructorAnalytics.tsx` — Brand stat cards, chart containers

### Admin Dashboard (12 files)
16. `AdminBatches.tsx` — Brand table with maroon header, create/edit dialogs, enroll dialog
17. `AdminStudents.tsx` — Brand user cards/table, role badges, search/filter
18. `AdminFeedback.tsx` — Brand feedback cards, star display in gold, filter selects
19. `AdminLiveClasses.tsx` — Brand table, live badges, tabs
20. `AdminApprovals.tsx` — Brand approval cards, approve/reject buttons
21. `AdminCourses.tsx` — Brand course table, status badges, search
22. `AdminCurriculum.tsx` — Brand tabs, accordion, section management
23. `AdminActivityLog.tsx` — Brand table, pagination, action badges
24. `AdminAnalytics.tsx` — Brand stat cards, chart containers
25. `AdminCategories.tsx` — Brand table/list styling
26. `AdminEvents.tsx` — Brand event cards
27. `AdminSchedule.tsx` — Brand schedule table

### Also update
28. `DashboardClassLog.tsx`, `DashboardProjects.tsx` — Brand styling if they have content
29. `InstructorCourses.tsx`, `InstructorClassLog.tsx`, `InstructorSubmissions.tsx`, `CreateCourse.tsx` — Brand styling
30. `AdminCoupons.tsx`, `AdminInquiries.tsx`, `AdminJobs.tsx`, `AdminSubjectAllocation.tsx`, `AdminUserVerification.tsx` — Brand styling

---

## Implementation Approach

Will process in 4 batches to stay within token limits, verifying TypeScript compilation after each:

**Batch 1**: Student pages (DashboardAssignments, StudentLiveClasses, StudentChat, StudentFeedback, DashboardCurriculum, DashboardProfile, DashboardCourses, DashboardSchedule, DashboardCertificates)

**Batch 2**: Tutor pages (InstructorAssignments, InstructorStudents, TutorLiveClasses, TutorMessages, TutorCurriculum, InstructorAnalytics + remaining instructor files)

**Batch 3**: Admin pages part 1 (AdminBatches, AdminStudents, AdminFeedback, AdminLiveClasses, AdminApprovals, AdminCourses)

**Batch 4**: Admin pages part 2 (AdminCurriculum, AdminActivityLog, AdminAnalytics, AdminCategories, AdminEvents, AdminSchedule, AdminCoupons, AdminInquiries, AdminJobs, AdminSubjectAllocation, AdminUserVerification)

Each file gets the same treatment: replace generic shadcn classes with the brand design system tokens while preserving all data fetching, state management, and business logic.

