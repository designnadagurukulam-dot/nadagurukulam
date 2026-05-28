# Phase 6 — Admin polish + Landing/About/Courses refinements

## 1. Admin → Subject Allocation ("Teachers" tile)
File: `src/pages/admin/AdminTeachers.tsx`

Currently the page already loads instructor profiles but the "Teachers" tile just toggles the existing card list (which shows only allocation info — no IDs, emails, programme metadata).

Change: Replace the toggled card list with the **same user row UI used in `AdminStudents.tsx`**, pre-filtered to `role = 'instructor'`. Keep allocation tooling (Assign Subjects, Assign Batch) as extra actions in the expanded row.

- Extract the user-row card from `AdminStudents.tsx` into a shared `<UserRow />` component (`src/components/admin/UserRow.tsx`) — props: profile, role, onVerify, onResetPassword, extraActions, contextLabel.
- Use it in both `AdminStudents.tsx` and `AdminTeachers.tsx`.
- **Hide role-change controls** (Promote/Demote select) on `AdminTeachers.tsx` per request.

## 2. Edit user details + Reset password (Users page)
File: `src/pages/admin/AdminStudents.tsx` (+ shared `UserRow`)

- Add **"Edit details"** dialog on each row: editable fields = `phone`, `course_name`, `department`, `designation`, `specialization`, `admin_label`, `roll_number`/`employee_id`/`enrollment_id` (whichever applies for that role). **Personal identity fields locked**: `display_name`, `email` (auth-managed).
- Add **"Reset password"** action: calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`. Need a small edge function `admin-get-user-email` (service-role) to fetch the auth email from `user_id`, since profiles table doesn't store it.
- Confirms via toast.

## 3. About page — animations replay every visit
File: `src/pages/About.tsx`

All `motion` blocks use `viewport={{ once: true }}`. Change to `viewport={{ once: false, amount: 0.25 }}` and add `initial="hidden"` so they re-run on each scroll into view.

## 4. About page — content & visuals
File: `src/pages/About.tsx`

- **Item 5 (Founder section):** keep founder section on About but swap Sadguru's image to a different portrait and swap his message text for an alternate quote. Landing page keeps the original founder section unchanged. *(Assumption — flag if you wanted Sadguru removed from About instead.)* Will use `SadguruSriMadhusudanSai2.jpg` if available; else ask for asset.
- **Item 6 (Hero background):** replace `campusAerial` with a more authentic performance photo — propose `imgConcert` (`NGR6_M1630.webp`) or `imgChorus`. Default → `imgConcert`.
- **Item 7 (Our Foundation white fade):** remove `section-glass` class on the "Our Foundation" section (line 157) — it's the source of the white veil.
- **Item 8 (Upcoming Campus dedup):** delete the `Our Upcoming Campus` bento section from `About.tsx`. Keep it only on the landing page (`Index.tsx`).

## 5. Landing page — logo intro
File: `src/pages/Index.tsx` (hero brand lockup, lines 219-253)

Logo PNG has transparent background and the circular border appears before the image paints, causing a "weird" empty ring on entrance. Fix:
- Replace the entrance transition: animate logo + wordmark together with `opacity 0→1, scale 0.96→1` over 0.6s **after the white background plate is in place** (no border/ring fade-in separately).
- Pre-load the logo by adding `loading="eager"` and `decoding="sync"`.
- Keep white bg via `bg-background` on the circular wrapper; remove the `ring-2` to avoid the double-halo look.

## 6. Courses page — hero & animations
File: `src/pages/Courses.tsx`

- **Item 9 (jerky):** the per-card `delay: i * 0.1` causes cascade stutter and `AnimatePresence mode="wait"` re-mounts everything on tab change. Switch to a single shared `transition={{ duration: 0.4, ease: "easeOut" }}` with `staggerChildren: 0.06` via a parent variant; drop `AnimatePresence mode="wait"` and animate opacity only on filter change.
- **Item 10 (hero collage):** replace single hero image with a 6-tile collage of maestros across genres (Vocal, Instrumental, Dance — Carnatic + Hindustani). New component `<MaestroCollage />` using existing gallery assets:
  - `NGZ6R_1512_R.webp` (vocal), `NGDSC_8160.webp` (male chorus), `NGDSC_7428.webp` (dance), `NGZ6R_6439_R.webp` (percussion), `NGMUSIC-2.webp` (sitar), `NGR6M_0933.webp` (chorus).
  - Tailwind grid with subtle parallax + dark gradient so the Sanskrit text remains readable.
  - *If you have actual maestro portraits to upload, we'll swap them in.*

## Files touched
- `src/pages/admin/AdminTeachers.tsx`
- `src/pages/admin/AdminStudents.tsx`
- `src/components/admin/UserRow.tsx` (new)
- `src/components/admin/EditUserDialog.tsx` (new)
- `supabase/functions/admin-get-user-email/index.ts` (new edge function)
- `src/pages/About.tsx`
- `src/pages/Index.tsx`
- `src/pages/Courses.tsx`
- `src/components/MaestroCollage.tsx` (new)

## Open question (Item 5)
"Sadguru's message we can change in the about page with a different image" — I'm reading this as: keep Sadguru on both pages, but on About use a **different photo + a different message**. Confirm — or if you actually meant "remove Sadguru's section from About entirely and only keep institutional content there", say so and I'll adjust.
