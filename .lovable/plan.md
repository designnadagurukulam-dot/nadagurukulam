

## Color Palette Overhaul — Nada Gurukulam

### Color Mapping

Based on the provided RGB values and the reference site (deep maroon + warm gold on cream):

```text
Role              Current (HSL)           New (RGB → Hex)
─────────────────────────────────────────────────────────
Background        #FFF8E7 (bright cream)  #FAF3EA (warm cream)
Primary           #BE1E1C (bright red)    #76161A / #86191C (deep maroon)
Gold (secondary)  #FFB400 (neon amber)    #D69D53 (warm gold)
Gold alt          —                       #DDAD6E (medium gold)
Card/muted bg     warm off-white          #F0DCC1 (peach cream)
Dark sections     hsl(0 69% 20%)          #76161A deepened for footers/heroes
```

### What Changes

**1. CSS Variables (`src/index.css`)**
- Update `:root` variables: `--background`, `--primary`, `--secondary`, `--accent`, `--card`, `--muted`, `--border` to match the new palette
- Update all gradient utilities (`.gradient-maroon`, `.gradient-gold`, `.text-gold`, `.hero-overlay`, `.section-dark`, `.golden-border`, etc.) to use the new hex/hsl values
- Update `.shimmer-line`, `.badge-gold`, `.portrait-gold-ring`, `.card-glass-gold` accent colors from #FFB400 → #D69D53/#DDAD6E tones
- Update dark mode variables proportionally

**2. Inline styles across pages (~17 files)**
Systematically replace hardcoded `hsl(0 69% 33%)`, `hsl(43 72% 52%)`, `hsl(48 90% 60%)`, `hsl(345 75% ...)` references in:
- `Index.tsx` — hero overlay, stats section, CTA section gradients
- `Footer.tsx` — footer background gradient, shimmer line
- `Courses.tsx`, `Gallery.tsx`, `About.tsx`, `Faculty.tsx` — hero overlays
- `Contact.tsx` — decorative bars
- `LoginSelect.tsx`, `Login.tsx`, `Register.tsx` — accent gradients
- Dashboard pages — header gradients
- `DashboardSidebar.tsx` — active states

**3. Tailwind Config (`tailwind.config.ts`)**
- No structural changes needed; colors flow from CSS variables
- Add custom color tokens if needed: `gold-light: #DDAD6E`, `cream: #F0DCC1`

### Color Usage Strategy

| Context | Color |
|---------|-------|
| Page backgrounds | #FAF3EA |
| Cards, form areas | #F0DCC1 with white overlay |
| Primary buttons, navbar active | #86191C (maroon) |
| Hero/footer dark backgrounds | #76161A → #86191C gradient |
| Gold accents, borders, icons | #D69D53 |
| Gold highlights, hover states | #DDAD6E |
| Text on dark backgrounds | #FAF3EA / #F0DCC1 |
| Text on light backgrounds | #76161A / dark brown |

