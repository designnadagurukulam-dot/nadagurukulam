

# Major Design Upgrade + New Campus & Founder Photos

## Overview
This is a comprehensive update that (1) adds 9 new uploaded images to the project, (2) places the founder, director, and campus photos in their correct locations, and (3) significantly upgrades the visual design across every page with modern animations, richer layouts, and more polished aesthetics.

---

## New Images to Add

| Image | Identity | Placement |
|-------|----------|-----------|
| `Sadguru-Sri-Madhusudan-Sai.jpg` | Founder portrait | About page Founder's Message section, Homepage faculty showcase |
| `NGSmt-Revathi-Ramachandran.webp` | Director portrait | About page Director's Message, Faculty page card, Homepage faculty showcase |
| `Director.webp` | Founder + Director together | About page (new "Leadership" section) |
| `NGReception.jpg` | Campus reception 3D render | Contact page info panel, About page |
| `NGSaiGramamMusicAndDanceSchoolExterior3dModelAerialView01.jpg` | Campus aerial 3D render | About page "Our Campus" new section, Homepage feature |
| `NGSaiGramamMusicAndDanceSchoolExterior3dModelCenterAmphitheatreView02.jpg` | Amphitheatre view | Gallery campus category, Admissions page |
| `NGSaiGramamMusicAndDanceSchoolExterior3dModelVaultPassage.jpg` | Vault/corridor render | Login page left panel, Gallery |
| `NGVerandah.jpg` | Verandah walkway | Register page left panel, Gallery |
| `NGAmphy-theatre-entry.jpg` | Amphitheatre entry | Gallery, About page campus section |

---

## Design Upgrades

### 1. Enhanced Animations (tailwind.config.ts + index.css)
- Add new keyframe animations: `float`, `shimmer`, `slide-up`, `blur-in`, `glow-pulse`
- Add a subtle gold shimmer line animation for section dividers
- Add smooth parallax scroll effect utility class
- Add glassmorphism card variant class
- Add text gradient utility for golden shimmering headings
- Add staggered entrance animations for grid items

### 2. Upgraded Section Divider (SectionDivider.tsx)
- Replace simple line + diamond with animated ornamental mandala SVG pattern
- Subtle gold shimmer animation on the ornament
- Wider decorative lines with gradient fade

### 3. Homepage (Index.tsx) -- Major Overhaul
- **Hero**: Add animated particle/floating notes effect behind text, stronger gradient, text shadow for drama
- **Features**: Upgrade to glassmorphism cards with icon overlays and hover lift+glow effects
- **Courses**: Add "ribbon" badge for level, hover card flip or tilt effect
- **Stats**: Add animated counting with suffix, glowing number effect
- **Faculty Showcase**: Use REAL founder/director photos -- Sadguru Sri Madhusudan Sai photo and Smt. Revathi Ramachandran photo in proper circular frames
- **Testimonials**: Add star rating animation, subtle card floating effect
- **CTA**: Full-bleed with animated gradient overlay
- **New Section**: Add a "Our Campus" showcase section with the 3D renders (aerial view, amphitheatre, reception) in an auto-scrolling carousel or staggered grid

### 4. About Page (About.tsx) -- Major Overhaul
- **Hero**: Use campus aerial view as background
- **Timeline**: Add connecting animated line that fills as you scroll, larger milestone thumbnails
- **Founder's Message**: Use actual `Sadguru-Sri-Madhusudan-Sai.jpg` portrait with elegant golden frame
- **Director's Message**: Use actual `NGSmt-Revathi-Ramachandran.webp` portrait
- **New "Our Leadership" Section**: Show the `Director.webp` (together photo) as a wide banner
- **New "Our Campus" Section**: Showcase 3D campus renders (aerial, amphitheatre, vault passage, verandah, reception) in a visually striking bento grid layout
- **Philosophy**: Use vault passage image as background for atmospheric effect

### 5. Faculty Page (Faculty.tsx)
- Use `NGSmt-Revathi-Ramachandran.webp` for Smt. Revathi's card instead of generic performance shot
- Enhanced card design with gradient border on hover, smoother image transitions

### 6. Gallery Page (Gallery.tsx)
- Add new campus 3D renders to the gallery under a new "Campus" category
- Enhanced masonry layout with varied card sizes (some large, some small)
- Smoother lightbox transitions

### 7. Login Page (Login.tsx)
- Replace left panel image with `NGSaiGramamMusicAndDanceSchoolExterior3dModelVaultPassage.jpg` (atmospheric corridor)
- Add subtle floating animation to the logo

### 8. Register Page (Register.tsx)
- Replace left panel image with `NGVerandah.jpg` (campus verandah walkway)

### 9. Contact Page (Contact.tsx)
- Use reception image in the info sidebar
- Add campus aerial view as hero background

### 10. Admissions Page (Admissions.tsx)
- Use amphitheatre view as hero background for fresh visual

### 11. Navbar (Navbar.tsx)
- Add subtle backdrop blur enhancement
- Smoother mobile drawer animation with framer-motion slide-in

### 12. Footer (Footer.tsx)
- Add subtle pattern overlay on the maroon gradient
- Slightly enhanced spacing and hover effects on links

---

## Technical Details

### Files to Create (asset copies)
- `src/assets/campus/NGReception.jpg`
- `src/assets/campus/NGCampusAerial.jpg`
- `src/assets/campus/NGAmphitheatre.jpg`
- `src/assets/campus/NGVaultPassage.jpg`
- `src/assets/campus/NGVerandah.jpg`
- `src/assets/campus/NGAmphyEntry.jpg`
- `src/assets/founders/SadguruSriMadhusudanSai.jpg`
- `src/assets/founders/Director.webp`
- `src/assets/founders/SmtRevathiRamachandran.webp`

### Files to Modify
1. `tailwind.config.ts` -- Add new keyframes and animation utilities
2. `src/index.css` -- Add glassmorphism, text-gradient, pattern overlay, and floating animation classes
3. `src/components/SectionDivider.tsx` -- Redesign with animated ornament
4. `src/pages/Index.tsx` -- Full redesign with campus section, real founder photos, enhanced animations
5. `src/pages/About.tsx` -- Add campus section, real founder/director photos, leadership banner
6. `src/pages/Faculty.tsx` -- Use real director photo, enhanced cards
7. `src/pages/Gallery.tsx` -- Add campus images, improved layout
8. `src/pages/Login.tsx` -- New left panel image (vault passage)
9. `src/pages/Register.tsx` -- New left panel image (verandah)
10. `src/pages/Contact.tsx` -- Reception image, aerial hero
11. `src/pages/Admissions.tsx` -- Amphitheatre hero
12. `src/components/Navbar.tsx` -- Framer-motion mobile drawer
13. `src/components/Footer.tsx` -- Pattern overlay, enhanced styling

### Dependencies
- No new dependencies needed; framer-motion already installed covers all animation needs

