

# Complete UI Overhaul: Cinematic, Attractive, Polished Design

## Overview
A sweeping visual overhaul of every public-facing page to create a cinematic, magazine-quality website with proper animations, visual elements, clear photo visibility, and simplified course cards (name only). Every section gets rethought for visual impact.

---

## 1. Courses Page -- Simplified Cards (Name Only)

**Remove** from course cards: level badges, duration, teacher name, description, outcomes, "Enquire Now" button.

**New card design**: Full-bleed image card with only the course name overlaid at the bottom in elegant serif text. Hover reveals a subtle gold shimmer. Clean, minimal, magazine-style.

**Remove** methodology section entirely for simplicity, or keep it minimal.

---

## 2. Homepage (`Index.tsx`) -- Major Visual Upgrade

**Hero Section**:
- Add animated golden mandala/ornamental SVG element rotating slowly behind the text
- Stagger text animations more dramatically (letter-by-letter for "Nada Gurukulam")
- Add a subtle grain/noise texture overlay for cinematic feel
- Increase hero to `min-h-[90vh]` for more impact

**Founder Section**:
- Add decorative golden corner ornaments
- Larger portrait with a warm vignette glow behind it
- Add a subtle parallax scroll effect on the portrait

**Course Cards on Homepage**:
- Simplify to show only course name on image card (matching Courses page)
- Remove level, teacher, description, button

**Faculty Showcase**:
- Fix image cropping with `object-position: center 15%` (slightly higher to capture faces better)
- Add subtle golden frame border on hover

**Campus Bento Grid**:
- Increase row heights back to `180px` for better visibility
- Add hover overlay with location name

**Stats Section**:
- Add animated counting numbers with gold shimmer
- Add decorative separator lines between stats

**Testimonials**:
- Add decorative quotation marks (large, gold, serif)
- More visual depth with layered backgrounds

**CTA Section**:
- Add floating animated musical note icons
- More dramatic gradient

---

## 3. Faculty Page -- Attractive Card Redesign

**Cards**:
- Fix image cropping: `object-position: center 15%` to show faces clearly
- Increase image height for better face visibility
- Add golden bottom border accent
- On hover: elegant lift + golden border glow + image zoom
- Remove awards line from cards (keep on detail page only)
- Ensure all 11 faculty members display properly

**Faculty Detail Page**:
- Fix hero image `object-position: center 15%`
- Add decorative gold ornamental dividers between sections
- More visual polish on the sidebar photo

---

## 4. About Page -- More Visual Impact

- Add subtle parallax on hero background image
- Founder portrait: add warm golden glow/vignette behind image
- Vision/Mission/Values cards: add animated icon entrance
- Campus bento: increase row heights for better visibility
- Philosophy section: add animated decorative elements

---

## 5. Gallery Page -- Visual Polish

- Add hover animations with golden overlay shimmer
- Improve lightbox with smoother transitions
- Category badges more elegant

---

## 6. Global CSS Enhancements (`index.css`)

Add new utility classes:
- `.animate-float` -- gentle floating animation for decorative elements
- `.animate-glow-pulse` -- pulsing golden glow for CTAs
- `.ornament-gold` -- decorative SVG ornament styling
- `.grain-overlay` -- cinematic film grain texture
- Improve `.text-shimmer-gold` animation speed

---

## 7. Admissions & Contact Pages

- Tighten visual consistency
- Add animated decorative elements
- Ensure no oversized cards

---

## Files to Modify

| File | Key Changes |
|------|-------------|
| `src/pages/Index.tsx` | Hero animation upgrade, simplified course cards (name only), fix image cropping, add decorative elements, floating particles enhanced |
| `src/pages/Courses.tsx` | Simplified cards with name only, remove level/duration/teacher/outcomes/button |
| `src/pages/Faculty.tsx` | Fix image cropping (`object-position: center 15%`), remove awards from cards, visual polish |
| `src/pages/FacultyDetail.tsx` | Fix hero image position, add decorative elements |
| `src/pages/About.tsx` | Fix image positions, add decorative elements, visual polish |
| `src/pages/Gallery.tsx` | Hover effects, visual polish |
| `src/pages/Admissions.tsx` | Visual consistency |
| `src/pages/Contact.tsx` | Visual consistency |
| `src/index.css` | New animation utilities, grain overlay, enhanced shimmer effects |
| `src/components/SectionDivider.tsx` | Enhanced golden glow animation |

