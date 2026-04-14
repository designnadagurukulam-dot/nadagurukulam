

# Fix Alignment and Responsiveness Across All Public & Dashboard Pages

## Issues Found (432px Mobile Viewport)

1. **Index.tsx — Founder section**: Grid stacks on mobile but image container has no centering constraint, causing the founder image + decorative quote mark to extend beyond viewport on the left
2. **Index.tsx — Hero title**: `text-6xl` on mobile is very large for 432px, "Gurukulam" in outline text wraps awkwardly
3. **About.tsx — Founder section**: Same grid overlap issue — image extends beyond left edge on mobile
4. **About.tsx — Vision/Mission timeline**: Timeline dot at `left-6` with cards at `ml-16` creates cramped layout on narrow screens; cards have `w-full` but are constrained by parent flex
5. **About.tsx — Director + Vision sections**: `w-72 h-80` fixed image sizes can overflow on 432px viewport
6. **Index.tsx — Stats section**: `text-6xl` stat numbers are tight on 2-column mobile grid
7. **Footer**: Contact info and course list side-by-side at `md` breakpoint can feel cramped on tablet

## Files to Change

### 1. `src/pages/Index.tsx`
- **Hero title**: Reduce mobile font from `text-6xl` → `text-4xl sm:text-6xl` for better fit
- **Founder section**: Add `overflow-hidden` to the section container and center the image properly on mobile with `mx-auto` on the vignette-gold wrapper
- **Stats**: Reduce mobile stat number size from `text-6xl` → `text-4xl sm:text-6xl`
- **CTA section heading**: Reduce from `text-5xl` → `text-3xl sm:text-5xl` on mobile

### 2. `src/pages/About.tsx`
- **Founder section**: Add proper mobile containment — reduce image size on mobile from `w-64 h-72` to `w-56 h-64 sm:w-64 sm:h-72`, ensure the decorative quote mark doesn't overflow
- **Vision/Mission timeline**: On mobile, increase `ml-16` → `ml-20` or reduce dot size to prevent text cramping; add `overflow-hidden` to the timeline section
- **Director section**: Reduce mobile image from `w-60 h-72` → `w-52 h-64 sm:w-60 sm:h-72`
- **Vision section (bottom)**: Reduce image from `w-72 h-80` → `w-60 h-72 sm:w-72 sm:h-80`
- **Campus heading**: Reduce `text-4xl` for "Our Upcoming Campus" which is long — use `text-3xl sm:text-4xl`

### 3. `src/components/Footer.tsx`
- Ensure bottom copyright row wraps properly on narrow screens — add `flex-wrap` and reduce text size
- Check that social icons row doesn't overflow

### 4. `src/pages/Courses.tsx`
- Verify course cards grid is `grid-cols-1 sm:grid-cols-2` (currently looks OK from screenshots but confirm)

### 5. `src/pages/Contact.tsx`
- Verify form fields and contact info cards stack properly on mobile

### 6. `src/pages/Events.tsx` & `src/pages/Gallery.tsx`
- Quick check and fix any grid overflow issues on mobile

### 7. `src/pages/Faculty.tsx`
- Check faculty grid cards for mobile alignment

## Key Patterns
- Replace all `text-6xl` and above with responsive sizes (`text-3xl sm:text-5xl md:text-6xl`)
- Add `overflow-hidden` to sections with absolute-positioned decorative elements
- Ensure fixed-width image containers use responsive sizes (`w-56 sm:w-64 md:w-80`)
- Add `px-4` padding to all section containers for safe mobile margins
- Fix `flex-wrap` on footer copyright row

