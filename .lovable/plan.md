

# Redesign Curriculum UI — Sidebar + Content Panel Layout

## Summary

Replace the current nested accordion (dropdown) layout with a **two-panel layout**: a **left sidebar** listing chapters, and a **right content panel** showing topics with material filter buttons when a chapter is selected.

## New Layout

```text
┌─ Semester Tabs ─────────────────────────────────────────┐
│ [Sem 1] [Sem 2] ... [Sem 8]                            │
├─────────────────────────────────────────────────────────┤
│  Subject Card: "Foundation Course"  [NMV-101] [24h]    │
│ ┌──────────────────┬────────────────────────────────┐   │
│ │  CHAPTERS (sidebar)│  TOPICS (content panel)       │   │
│ │                    │                                │   │
│ │  ● Ch 1: Recap... │  Chapter 1: Recapitulation...  │   │
│ │    (active/highlighted)│                            │   │
│ │  ○ Ch 2: Sarali.. │  ┌─ Filter Pills ───────────┐  │   │
│ │  ○ Ch 3: Janta... │  │ [▶ Videos(2)] [🎵 Audio] │  │   │
│ │                    │  │ [📄 PDFs]  [📝 Notes(1)] │  │   │
│ │                    │  └──────────────────────────┘  │   │
│ │                    │                                │   │
│ │                    │  Topic 1: Intro to Sarali...   │   │
│ │                    │    [video embed / audio / etc] │   │
│ │                    │                                │   │
│ │                    │  Topic 2: Practice patterns    │   │
│ │                    │    [materials...]               │   │
│ └──────────────────┴────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Single file: `src/pages/dashboard/DashboardCurriculum.tsx`

1. **Add state**: `selectedChapter: string | null` — tracks which chapter is active per subject.

2. **Replace the nested Accordion** inside each Subject Card with a **flex two-column layout**:
   - **Left column (~30% width, scrollable)**: List of chapter names as clickable items with left-border accent on active. Shows chapter name + topic count badge. On mobile (< md), this becomes a horizontal scrollable strip or a select dropdown above the content.
   - **Right column (~70% width)**: Shows the selected chapter's heading, description, and a flat list of topics. Each topic is a card with the filter pills (Videos/Audio/PDFs/Notes) at the top and material content below. No more nested accordion for topics — they're all visible as cards in a scrollable list.

3. **Topic cards in right panel**: Each topic rendered as a bordered card with:
   - Topic title as header
   - Filter pill buttons fixed at top of each card (reuse existing `TopicContent` component)
   - Expanded by default (no accordion toggle needed)

4. **Mobile responsive**: On small screens (`< md`), stack vertically — chapter list on top as a horizontal scroll strip, topics below.

5. **Keep all existing**: `TopicContent`, `classifyMaterials`, material rendering, semester tabs, subject cards — only the chapter→topic navigation changes from accordion to sidebar+panel.

### Visual Details
- Active chapter: `bg-brand-primary/10 border-l-3 border-brand-primary` with bold text
- Inactive chapters: subtle hover effect, left border transparent
- Right panel: clean white background with topic cards separated by spacing
- Empty state: "Select a chapter" prompt when none selected, auto-select first chapter

