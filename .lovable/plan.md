

# Premium Curriculum UI Redesign — Rich Visuals and Engaging Design

## Summary

Transform the current basic-looking curriculum page into a visually rich, engaging LMS experience with gradient cards, decorative icons, animated interactions, progress indicators, and polished material cards.

## Key Visual Upgrades

### 1. Page Header — Hero-style with decorative elements
- Gradient background banner (maroon-to-gold subtle gradient) behind the title
- Decorative icon (GraduationCap or BookOpen) with a gold circle backdrop
- Subtitle with a warm, inviting tone

### 2. Semester Tabs — Pill-style with icons
- Each semester tab gets a subtle gradient on active state (maroon-to-deep-maroon)
- Active tab has a gold bottom accent and slight scale animation
- Add a small `GraduationCap` or number badge icon inside each tab

### 3. Subject Card — Premium glassmorphism card
- Subtle gradient header strip (maroon to transparent) at the top of each subject card
- Decorative gold corner accents or a thin gold top border
- Course code badge gets a gradient background (gold shimmer)
- Add a decorative music note or book icon watermark in the card background (low opacity)

### 4. Chapter Sidebar — Rich interactive list
- Each chapter item gets a subtle hover animation (slide-right effect)
- Active chapter: gradient left border (gold-to-maroon), warm cream background with a subtle glow
- Add numbered circle badges (Ch 1, Ch 2...) with gold backgrounds
- Add a small progress dot or checkmark for chapters that have content

### 5. Topic Cards — Elevated card design
- Each topic card gets a subtle shadow, rounded-2xl, and a thin left accent border in gold
- Topic title gets a decorative icon (Sparkles or Music) before it
- Hover effect: slight elevation (shadow increase) and border color change

### 6. Material Filter Pills — Glossy button style
- Filter pills get gradient backgrounds when active (e.g., red gradient for Videos, blue gradient for PDFs)
- Add subtle shadow and scale-up animation on hover
- Icons get a small circular background (colored circle behind the icon)

### 7. Content Display — Rich media cards
- **Video embeds**: Rounded-2xl with a decorative play button overlay, subtle shadow, label card below
- **Audio**: Waveform-style decorative background, brand-gold themed player card with headphones icon
- **PDFs**: Card with a file preview icon, download arrow, and paper-texture background
- **Notes**: Elegant blockquote with decorative quotation mark icon, serif font for content

### 8. Empty States — Illustrated placeholders
- Empty states get a larger decorative icon with gradient coloring
- Add encouraging text like "Content coming soon — stay tuned!"

## Technical Details

### Single file change: `src/pages/dashboard/DashboardCurriculum.tsx`

- Add new Lucide icons: `GraduationCap`, `Sparkles`, `Music`, `Download`, `Play`, `FolderOpen`, `Layers`
- Apply Tailwind gradient classes (`bg-gradient-to-r`, `bg-gradient-to-br`) for card headers and active states
- Use `hover:scale-[1.02]`, `hover:shadow-lg`, `transition-all duration-300` for interactive elements
- Add numbered chapter badges with `w-7 h-7 rounded-full bg-brand-gold/20 text-brand-primary` styling
- Enhance topic cards with `shadow-[0_2px_12px_rgba(196,154,60,0.1)]` gold-tinted shadows
- Update filter pills with gradient active states and `backdrop-blur` effects
- Add decorative watermark elements using absolute-positioned low-opacity icons

