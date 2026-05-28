
# Phase 5 — Landing page polish, About animations, sidebar badge cleanup

Small, scoped UI/animation pass. No DB changes, no new features.

---

## 1. Sidebar badge "unviewed only" (Users, Assignments, Feedback)

**Problem:** Badges always show counts even after admin has reviewed the section.

**Fix:** Track "last viewed" timestamp per section in `localStorage`. Only show badge when there are items created/updated after that timestamp.

- In `DashboardSidebar.tsx` `useQuery`, for `Users` / `Assignments` / `Feedback`, also pass `?gt(created_at, lastViewedAt)` filter using the stored timestamp (default = epoch so first load still shows).
- On the matching pages (`AdminStudents`, `AdminAssignments`, `AdminFeedback`), write `localStorage[lastViewed:<key>] = new Date().toISOString()` on mount + refetch sidebar counts.
- Other badges (Course Approvals, Messages, Reach Out) keep existing behavior.

## 2. Label rename

`src/pages/admin/AdminTeachers.tsx:239` — change "Also assigned to:" → "Assigned to:".

## 3. Landing page (`src/pages/Index.tsx`)

1. **Circular logo** — wrap hero logo `<img>` in `rounded-full overflow-hidden` container, crop to circle.
2. **Mandala behind logo, not behind "Nada Gurukulam"** — move `<GoldenMandala />` so it's centered on the logo badge (offset upward), and constrain its size/position so it doesn't overlap the heading text. Likely: render mandala absolutely positioned to logo wrapper instead of section center.
3. **Equal glow on both buttons** — the "Explore Courses" button uses `animate-glow-pulse`; "Contact Us" doesn't. Decision: **remove glow from both** for consistency (keep shadow only). If you prefer glow on both, say so.
4. **Smooth marquee** — current `marquee-content` likely uses `translateX(-50%)` with duplicated items. The jerk is from a gap between the end and restart. Fix by ensuring exact duplication (already done) and using `animation: marquee Xs linear infinite` with `transform: translateX(0) → translateX(-50%)` and `will-change: transform`. Audit `.marquee-content` / `.marquee-content-reverse` in `index.css` and adjust keyframes for seamless loop.
5. **Slow fade-in for "Nada Gurukulam" heading** — replace the per-letter blur-in animation with a single slow opacity fade (`initial opacity:0 → 1`, duration ~2.5s, ease-out). Keep the gradient/outline styling.
6. **Logo zoom area** — the logo badge has hover zoom but isn't a link. Remove the zoom animation, and add "Nada Gurukulam" wordmark text next to the logo inside the badge so it reads as a brand lockup rather than a button.

## 4. About page (`src/pages/About.tsx`)

1. **Sadguru photo fade-in** — current image has no animation. Wrap the founder `<img>` container in `motion.div` with `initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1.5}} viewport={{once:true}}`.
2. **Founder's message visibility** — current blockquote uses `text-foreground/70` (low contrast on cream). Bump to a darker maroon/charcoal: `text-foreground` or `text-brand-primary` for the body, keep gold accent on the heading. Same for second blockquote (currently `/55`).
3. **Rotating chakra (red circle)** — wrap the existing red ornament/timeline-dot circle in `motion.div` with `animate={{rotate:360}} transition={{repeat:Infinity, duration:30, ease:"linear"}}`. (Need to confirm which red circle — likely the decorative one near the Foundation timeline or vision section. I'll target the most prominent red circular element on the page.)

---

## Technical notes

- `localStorage` key format: `lastViewed:users`, `lastViewed:assignments`, `lastViewed:feedback`.
- Sidebar query already invalidated on route change is not automatic — add `queryClient.invalidateQueries(["sidebar-counts"])` from the admin pages after stamping localStorage.
- All color changes use semantic tokens from `index.css` (no raw hex).
- No changes to `tailwind.config.ts`, no new packages.

## Files touched

- `src/components/DashboardSidebar.tsx`
- `src/pages/admin/AdminStudents.tsx`, `AdminAssignments.tsx`, `AdminFeedback.tsx` (mount-time stamp)
- `src/pages/admin/AdminTeachers.tsx` (label)
- `src/pages/Index.tsx` (hero logo, mandala, buttons, heading fade, brand lockup)
- `src/pages/About.tsx` (founder fade, message contrast, rotating chakra)
- `src/index.css` (marquee keyframe smoothing if needed)

## Open question

For the **chakra rotation** on About — there isn't an obvious single "red circle" in the source. Do you mean (a) the maroon timeline dots in the Foundation section, (b) a decorative element I should add, or (c) something else visible on screen I should screenshot first? Default if unanswered: I'll add a rotating decorative chakra SVG behind the founder photo.
