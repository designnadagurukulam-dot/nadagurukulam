

# Replace All Stock Images with Your Real Photos

## Overview
Remove every Unsplash stock image across the entire site and replace them with your 10 uploaded photos, strategically placed to match the context of each section.

---

## Image Mapping

Here is how each uploaded photo will be used across the site:

| Photo | Description | Where it will be placed |
|-------|-------------|------------------------|
| `NGMUSIC-13.webp` | Student playing veena on lawn | **Homepage hero background**, Courses page hero, Veena/instrumental course card |
| `NGR6_M1630.webp` | Grand stage concert with backdrop | **About page hero**, Homepage stats parallax background, Login page left panel |
| `NGZ6R_1931_R.webp` | Bharatanatyam group (Krishna theme) | Bharatanatyam course card, Dance feature card, Gallery |
| `NGR6M_9613.webp` | Dancers in pink/magenta | Admissions hero, Dance-related sections |
| `NGZ6R_1512_R.webp` | Vocal concert (singer in blue saree) | Carnatic Vocal course card, Faculty hero |
| `NGZ6R_6439_R.webp` | Tabla/percussion ensemble | Mridangam/Tabla course cards, Percussion sections |
| `NGR6M_0933.webp` | Vocal chorus in purple sarees | Homepage CTA background, Vocal ensemble sections |
| `NGR6M_2124_R.webp` | Large vocal ensemble in cream | Contact page hero, About philosophy background |
| `NGR6M_9591.webp` | Dance performance (sitting + standing) | Gallery, Admissions scholarship section |
| `NGMUSIC-6.webp` | Students singing outdoors with tanpura | Features "Traditional Excellence" card, Register page, Homepage testimonials background |

---

## Files to Modify

### New Asset Files (copy uploads into project)
All 10 images copied to `src/assets/gallery/` folder for proper bundling.

### Pages to Update

1. **`src/pages/Index.tsx`** -- Replace all Unsplash URLs in: hero background, features array, courses array, testimonials section (remove stock portraits, use music photos), faculty showcase (use performance photos), stats parallax background, CTA background
2. **`src/pages/About.tsx`** -- Replace: hero background, timeline milestone thumbnails, founder/director photos (use performance shots), philosophy background
3. **`src/pages/Courses.tsx`** -- Replace: hero background, all 6 course card images
4. **`src/pages/Faculty.tsx`** -- Replace: hero background, faculty card photos (use performance images)
5. **`src/pages/Admissions.tsx`** -- Replace: hero background, scholarship section image
6. **`src/pages/Gallery.tsx`** -- Replace all Unsplash gallery images with the 10 real photos
7. **`src/pages/Contact.tsx`** -- Replace: hero background
8. **`src/pages/Login.tsx`** -- Replace left panel Unsplash image
9. **`src/pages/Register.tsx`** -- Replace left panel Unsplash image
10. **`src/pages/dashboard/DashboardCourses.tsx`** -- Replace course card images

---

## Technical Approach

- Copy all 10 images to `src/assets/gallery/` using proper file copy
- Import them as ES6 modules in each page component
- Remove every `https://images.unsplash.com/...` URL
- Some images will be reused across multiple pages in different contexts (hero backgrounds vs. card thumbnails)
- All existing animations, overlays, and hover effects remain unchanged

