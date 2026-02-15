

# Faculty Data & Detail Page Overhaul: Real Data, Correct Order, Rich Profiles

## Overview
Replace all placeholder faculty data with the real, comprehensive details provided. Reorder faculty, add 2 new members (without photos for now), expand the data model to support detailed experience/specialities, and update the detail page to display all rich content.

---

## 1. Expand Data Model & Update Faculty Data (`src/data/facultyData.ts`)

**Expand the `FacultyMember` interface** to include:
- `specialities: string[]` (distinct from specialization — these are detailed skill areas)
- `experienceDetails: string[]` (rich list of career positions/roles)

**New faculty order** (as specified):
1. Smt Revathi Ramachandran — Director, Nada Gurukulam / Dance - Bharatanatyam
2. Ms Manasvini Korukkai Ramachandran — Dance - Bharatanatyam (NO photo yet, use placeholder)
3. Dr Dundayya Pujer — Instrumental Music - Tabla (NO photo yet, use placeholder)
4. Mr Srinivas Viswanadha — Vocal Music - Carnatic (NO photo yet, use existing placeholder)
5. Mr Shreerama Bhat — Vocal Music - Carnatic
6. Mr Prafulla Kumar Meher — Vocal Music - Hindustani
7. Mr Abhirama Bode — Vocal Music - Carnatic
8. Mr Pranav Kashyap — Vocal Music - Hindustani
9. Mr Sujan H N — Vocal Music - Carnatic
10. Mr Mangali Tirumala — Instrumental Music - Tabla
11. Ms Shailaja Kumari A — Vocal Music - Carnatic
12. Dr Neelam Patel — Vocal Music - Hindustani
13. Ms Nayana Shivaram — Dance - Bharatanatyam
14. Ms Ranjani Venkatesh — Vocal Music - Carnatic

**All bios, education, experience, specialities, and awards** will be replaced with the real data provided by the user. Every field will contain the actual content — no placeholders.

**Category updates:**
- Revathi: `dance` (was `carnatic`)
- Neelam Patel: `hindustani` (was `carnatic`)
- Sujan H N: `carnatic` (was `instrumental`)
- Shailaja Kumari: `carnatic` (was `bharatanatyam`)
- Abhirama Bode: `carnatic` (was `instrumental`)
- Mangali Tirumala: `instrumental` (stays)
- New category value `dance` added for Bharatanatyam members

**Categories array update:**
```
{ value: "dance", label: "Dance" }
```
replaces `{ value: "bharatanatyam", label: "Bharatanatyam" }`

**For new members without photos:** use a neutral placeholder (the logo or a generic silhouette). These will be replaced when photos arrive.

---

## 2. Update Faculty Detail Page (`src/pages/FacultyDetail.tsx`)

Expand the detail page to show all the rich data:

**Current sections:** About, Education, Awards
**New sections to add:**
- **Experience** — rendered as a detailed list of career positions with descriptions
- **Specialities** — rendered as styled tags/chips

**Section order on detail page:**
1. Hero banner with photo
2. About/Bio (long paragraph)
3. Education (bulleted list)
4. Experience (detailed career timeline)
5. Specialities (tag chips)
6. Awards & Recognition (tag chips)

The experience section will use the `experienceDetails` string array, each item rendered as a list entry with a gold bullet.

---

## 3. Faculty Listing Page (`src/pages/Faculty.tsx`)

**Minor update:** Show `title` (e.g., "Director, Nada Gurukulam") under the name for the Director card, and `specialization` for all others. No structural changes needed.

---

## 4. Homepage Faculty Showcase (`src/pages/Index.tsx`)

**Update** `facultyShowcase` to use `facultyMembers.slice(0, 5)` which will now correctly show the first 5 in the new order (Director, Manasvini, Dr Dundayya, Srinivas, Shreerama Bhat).

---

## Technical Details

| File | Changes |
|------|---------|
| `src/data/facultyData.ts` | Expand interface, reorder all 14 members, replace all data with real bios/education/awards/experience/specialities, add 3 new members (Manasvini, Dundayya, Srinivas), update categories |
| `src/pages/FacultyDetail.tsx` | Add Experience and Specialities sections to detail layout |
| `src/pages/Faculty.tsx` | Minor: update card info to show title for Director |
| `src/pages/Index.tsx` | No code change needed (already uses `facultyMembers.slice(0, 5)`) |
