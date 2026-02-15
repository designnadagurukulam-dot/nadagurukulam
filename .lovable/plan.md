

# Update Founder's Message, Remove Admissions Process & Timeline

## Overview
Three key changes: (1) Replace the placeholder Founder's Message with the actual spiritual message provided, (2) Transform the Admissions page into a simple "Contact Us / Pre-Registration Inquiry" page (no application process, no open enrollment messaging), and (3) Remove the timeline section from the About page.

---

## 1. About Page (`src/pages/About.tsx`)

**Remove the Timeline section entirely** (lines 76-120 including the milestones data array and the "Our Journey" section with the vertical gold timeline).

**Update Founder's Message** -- replace the current placeholder quote and description with the actual message:

> *"nada brahma, says our scriptures. Sound is divine or 'paramesti', as it is called. And while the seven notes of music have been inspired by various sounds in creation or 'srsti', it is the singular privilege of humans or 'vyasti' to sing and play music. The music that comes from 'paramesti' to 'srsti' to 'vyasti' must take all of us -- samasti back to divinity. Indian classical music that originated in the samaveda and evolved into its current form over centuries has been designed to do just that.*
>
> *To practise, promote and propagate this rich cultural and spiritual Indian music tradition is the purpose of establishing the Department of Music and Performing Arts at the Sri Sathya Sai University for Human Excellence, so that the parampara of the divine knowledge of music is seamlessly passed on from the masters to the seekers."*
>
> -- Sadguru Sri Madhusudan Sai, Founder, Nada Gurukulam

The layout will be expanded to give the full message proper breathing room with elegant typography.

---

## 2. Admissions Page (`src/pages/Admissions.tsx`)

**Complete overhaul** -- remove the following sections:
- Application Process timeline (6-step process)
- Eligibility Criteria
- Fee Structure table
- "Apply for Admission" CTA button
- "Applications are now open for 2025-26" messaging

**Replace with** a refined page that:
- Has a hero titled "Join Nada Gurukulam" (no mention of "open admissions")
- Shows a brief description of what the institution offers
- Keeps the Scholarships section (reworded subtly)
- Keeps FAQs (updated to remove application-process questions)
- Has a single CTA: "Contact Us for Inquiries" linking to the Contact page
- Feels welcoming but exclusive -- for pre-registered / invited candidates only

---

## 3. Navbar & Homepage -- Remove "Apply Now" / "Admissions" references

**Navbar (`src/components/Navbar.tsx`):**
- Rename "Admissions" link to "Join Us" (or keep but link behavior stays the same -- the page itself is changed)

**Homepage (`src/pages/Index.tsx`):**
- Change "Apply Now" hero button to "Contact Us" linking to `/contact`
- Change the CTA section at the bottom: "Apply for Admission" becomes "Get in Touch" linking to `/contact`
- Remove any "Applications open" language

**Contact page** -- no changes needed, it already serves as the primary inquiry form.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/About.tsx` | Remove timeline section + milestones data; update Founder's Message with real text |
| `src/pages/Admissions.tsx` | Remove application process, eligibility, fees; replace with inquiry-focused page |
| `src/pages/Index.tsx` | Change "Apply Now" buttons to "Contact Us"; update CTA section |
| `src/components/Navbar.tsx` | Optionally rename "Admissions" nav link |

