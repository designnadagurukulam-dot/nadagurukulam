

# Redesign Student Curriculum UI — Chapters, Topics, and Material Filters

## Summary

Restructure the curriculum page terminology and UI to follow the hierarchy: **Semester → Subject → Chapter → Topic → Materials (Videos / Audios / PDFs / Notes)**. Each topic opens to reveal fixed filter buttons at the top for material types, with a polished card-based layout.

## Terminology Changes

| Current term | New term |
|---|---|
| Module | Chapter |
| Section | Topic |
| "sections" badge | "topics" badge |

## New UI Layout

```text
┌─ Semester Tabs (1-8, Additional) ──────────────────┐
│                                                      │
│  ┌─ Subject Card (e.g. "Foundation Course") ───────┐ │
│  │  Course Code Badge    Total Hours               │ │
│  │                                                  │ │
│  │  ▶ Chapter 1: Recapitulation of fundamentals    │ │
│  │    ┌──────────────────────────────────────────┐  │ │
│  │    │  ▶ Topic: Introduction to Sarali Varisai │  │ │
│  │    │    ┌─────────────────────────────────┐    │  │ │
│  │    │    │ [▶ Videos] [🎵 Audio] [📄 PDF]  │    │  │ │
│  │    │    │ [📝 Notes]    ← filter buttons   │    │  │ │
│  │    │    │                                  │    │  │ │
│  │    │    │  (filtered content below)        │    │  │ │
│  │    │    └─────────────────────────────────┘    │  │ │
│  │    └──────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Implementation Details

### Single file change: `src/pages/dashboard/DashboardCurriculum.tsx`

1. **Update all labels**: "module" → "Chapter", "section" → "Topic" throughout the UI text and badges.

2. **Classify content types**: Create a helper that categorizes each topic's materials:
   - **Videos**: YouTube links (from `curriculum_section_links` or legacy `youtube_url`)
   - **Audio**: Links containing audio keywords or sections with `content_type === 'audio'` (future-proof)
   - **PDFs**: Links ending in `.pdf` or labeled as PDF
   - **Notes**: Text content (`content_type === 'text'`)

3. **Fixed filter buttons at the top of each Topic**:
   - Pill-shaped toggle buttons in maroon/gold theme: `Videos`, `Audio`, `PDFs`, `Notes`
   - Show count on each pill (e.g., "Videos (2)")
   - Default: show all materials; clicking a filter shows only that type
   - Disabled/greyed-out pills for types with 0 items

4. **Visual styling upgrades**:
   - Chapter rows: left maroon accent border, gold BookOpen icon, subtle hover effect
   - Topic cards: rounded-xl with cream background, slight shadow
   - Material type icons: PlayCircle (red) for videos, Headphones (brand-gold) for audio, FileText (blue) for PDFs, Type (grey) for notes
   - YouTube embeds in rounded containers with proper aspect ratio
   - Text notes in a styled blockquote-like container

5. **Nested accordion structure**: Chapters accordion → Topics accordion inside each chapter, keeping the hierarchy clear and collapsible.

### Data Note
Currently only `youtube` and `text` content types exist in the database. The UI will be future-proofed for `audio` and `pdf` types. PDF links will be detected by URL pattern (`.pdf` extension), and audio by URL pattern or a future `audio` content_type.

