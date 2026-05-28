# Phase 15: Chat attachments + Faculty rename

Scope: items 1 and 3 from your message. Item 2 (Analytics) needs no work yet — revisit once data exists.

## 1. Chat — attachments & voice notes

Add file/image attachments and recorded voice notes to the three chat surfaces:
`StudentChat.tsx`, `TutorMessages.tsx`, `AdminMessages.tsx`.

### Database (migration)
Extend `messages` table:
- `attachment_url text`
- `attachment_type text` — `image` | `file` | `voice`
- `attachment_name text`
- `attachment_size int`
- `voice_duration int` (seconds, nullable)

`content` becomes nullable (a message can be attachment-only). Existing rows unaffected.

### Storage
New private bucket `chat-attachments` with RLS:
- Path convention: `{sender_id}/{message_id_or_uuid}.{ext}`
- INSERT: any authenticated user into their own `{auth.uid()}/...` folder
- SELECT: only sender or receiver of a message that references the file (checked via signed URL on read — simpler: any authenticated user can SELECT, since URLs aren't enumerable and message RLS already gates discovery)

### Shared ChatComposer component
Build `src/components/chat/ChatComposer.tsx` used by all three pages:
- Text input (existing behavior preserved)
- 📎 Attach button → file picker (images, pdf, docx, audio; 10 MB cap)
- 🎤 Voice button → press to record (MediaRecorder, `audio/webm`), shows live timer, tap again to stop; preview with play/cancel/send
- On send: upload to `chat-attachments` → insert message row with `attachment_*` fields populated (and optional `content` caption)

### Shared MessageBubble component
`src/components/chat/MessageBubble.tsx`:
- Text → as today
- `image` → inline thumbnail, click to open lightbox
- `file` → filename chip + size + download icon
- `voice` → audio player with duration + waveform-less play/pause control
- Caption (if `content` set) renders below attachment

Replace inline bubble JSX in the three chat pages with `<MessageBubble />` and `<ChatComposer />`.

### Notes
- No new edge functions; client uploads directly to bucket using the user's session.
- Realtime subscription already in place will pick up new messages and re-render attachments.

## 2. Analytics tab
No code changes this phase. The page already renders zero-state cards; behavior will be evaluated once classes/assignments/messages have real data.

## 3. Rename Instructor / Tutor → Faculty (UI labels only)

Scope: **visible text strings only.** Routes (`/dashboard/tutor/*`), DB role (`instructor`), file names, component names, variable names, and `user_roles.role` enum all stay unchanged. Zero functional risk.

Find-and-replace in JSX/copy across:
- `DashboardSidebar.tsx` — menu labels ("Tutor Dashboard" → "Faculty Dashboard", "My Students" stays, etc.)
- Page headings/subheadings in `src/pages/instructor/*`, `src/pages/admin/*`, `src/pages/dashboard/*`
- Public site mentions: `About.tsx`, `Faculty.tsx` (already named Faculty), home sections
- Greeting line in dashboard (memory: "Role + Name" → role string becomes "Faculty")
- Toast messages, dialog titles, empty states, tooltips
- Sidebar role badge

Exclusions (do NOT change):
- DB columns/values, RLS policy names, function names
- Route paths
- TypeScript identifiers, file names, query keys
- `instructor_id` / `tutor_*` field references in code
- The word "instructor" inside SQL migration files

Verification: `rg -i 'instructor|tutor' src -g '*.tsx'` after edit — remaining matches should be identifiers only.

## Files touched

**New**
- `supabase/migrations/<ts>_chat_attachments.sql` — messages columns + bucket + RLS
- `src/components/chat/ChatComposer.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/VoiceRecorder.tsx` (internal helper)

**Edited**
- `src/pages/dashboard/StudentChat.tsx`
- `src/pages/instructor/TutorMessages.tsx`
- `src/pages/admin/AdminMessages.tsx`
- `src/integrations/supabase/types.ts` (regenerated)
- ~15 files for the Faculty label sweep (sidebar, instructor pages, public Faculty/About refs)

Approve and I'll run the migration first, then build the chat components, then do the rename sweep.
