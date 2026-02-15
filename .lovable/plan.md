

# Faculty Overhaul: Real Photos, Dedicated Detail Pages, Attractive Layout

## Overview
Replace placeholder faculty data with real uploaded photos, create individual detail pages (not popups) for each faculty member, fix image cropping so faces are always visible, and make the listing page more attractive with better card styles and animations.

---

## 1. Add Faculty Photos to Project

Copy all 9 uploaded images into `src/assets/faculty/`:
- `Dr-Neelam-Patel.jpg`
- `Ms-Nayana-Shivaram.jpg`
- `Ms-Ranjani-Venkatesh.jpg`
- `Mr-Mangali-Tirumala.jpg`
- `Mr-Pranav-Kashyap.jpg`
- `Mr-Sujan-H-N.jpg`
- `Ms-Shailaja-Kumari-A.jpg`
- `Mr-Abhirama-Bode.jpg`
- `Mr-Prafulla-Kumar-Meher.jpg`
- `Mr-Shreerama-Bhat.jpg`

Keep existing photos for Founder (Sadguru Sri Madhusudan Sai) and Director (Smt. Revathi Ramachandran).

---

## 2. Create Faculty Data File (`src/data/facultyData.ts`)

A shared data file used by both the listing page and detail pages:
- Each faculty member has: `id` (URL slug), `name`, `title`, `specialization`, `category`, `experience`, `bio`, `education`, `awards`, `image` (imported asset)
- Names extracted from image filenames:
  - Dr. Neelam Patel
  - Ms. Nayana Shivaram
  - Ms. Ranjani Venkatesh
  - Mr. Mangali Tirumala
  - Mr. Pranav Kashyap
  - Mr. Sujan H N
  - Ms. Shailaja Kumari A
  - Mr. Abhirama Bode
  - Mr. Prafulla Kumar Meher
  - Mr. Shreerama Bhat
  - Smt. Revathi Ramachandran (Director, existing photo)
- Founder (Sadguru Sri Madhusudan Sai) will NOT be in the faculty list but remains prominent on Index/About pages
- Placeholder bio/education/awards text since real data is not yet provided (user said more details will come later)

---

## 3. Create Faculty Detail Page (`src/pages/FacultyDetail.tsx`)

A full separate page (not a popup) for each faculty member at route `/faculty/:id`:
- Hero banner with faculty photo (large, face clearly visible using `object-position: top`)
- Name, title, specialization prominently displayed
- Sections for: About/Bio, Education, Awards, Experience
- Gold accent decorative elements matching the site theme
- Back button to return to faculty listing
- Animated entrance with framer-motion

---

## 4. Redesign Faculty Listing Page (`src/pages/Faculty.tsx`)

**Hero Section:**
- Keep existing hero but with subtle parallax and animated text

**Faculty Grid -- New Card Style:**
- Remove the popup/modal entirely
- Cards link to `/faculty/:id` instead of opening a modal
- Use `object-position: center 20%` on images so faces (top portion) are always visible, not cropped
- Card layout: portrait-style with image taking 65% height, name and specialization below in a clean white panel
- Subtle gold bottom border on each card
- On hover: gentle lift, shadow increase, image slight zoom
- Staggered entrance animations

**Filter Tabs:**
- Keep the pill-style filter tabs, ensure they look clean

---

## 5. Fix Image Cropping Site-Wide

Anywhere faculty/founder images appear (Index.tsx faculty showcase, About.tsx):
- Use `object-position: center 20%` or `object-top` so the face (upper portion) of the image is always visible
- Avoid `object-center` on portrait photos where heads get cut off

---

## 6. Update Routing (`src/App.tsx`)

Add new route:
```
<Route path="/faculty/:id" element={<Layout><FacultyDetail /></Layout>} />
```

---

## 7. Update Index.tsx Faculty Showcase

- Update the faculty showcase section on the homepage to use the real faculty data and photos
- Link cards to `/faculty/:id` detail pages
- Ensure Founder card remains most prominent

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/assets/faculty/*.jpg` | Copy 10 uploaded photos |
| `src/data/facultyData.ts` | Create shared faculty data |
| `src/pages/FacultyDetail.tsx` | Create new detail page |
| `src/pages/Faculty.tsx` | Redesign listing, remove modal, fix image positioning |
| `src/App.tsx` | Add `/faculty/:id` route |
| `src/pages/Index.tsx` | Update faculty showcase with real data and fix image cropping |

