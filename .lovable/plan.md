

# Fill Sample Data for End-to-End Testing

## Current State
- **6 courses** exist (Carnatic Vocal, Hindustani Vocal, Bharatanatyam, Mridangam, Tabla, Sitar) — all have `instructor_id = NULL`
- **85 curriculum modules** exist across semesters 1-8, but **0 curriculum sections** (no actual content)
- **0 batches**, **0 enrollments**, **0 course modules/lessons**, **0 assignments**, **0 live classes**, **0 feedback**
- **4 instructors** (Lakshay, Test Instructor, Zaid, Educator 2) — only Educator 2 is verified
- **5 students** (vikas, Srinivas, Harshit, Educator 1, Student 1) — only Student 1 is verified
- **2 admins** (Lakshay Saxena as super_admin, Admin as admin)

## Data to Insert

### 1. Verify key test accounts
Update profiles to set `is_verified = true` for:
- Instructor "Lakshay" (d5f82758) — will be the primary test tutor
- Student "vikas testing" (03f117cf) — primary test student
- Student "Srinivas V" (a0830260) — secondary test student

### 2. Assign instructors to courses
- Carnatic Vocal → Lakshay (d5f82758)
- Hindustani Vocal → Zaid (75a44a3e)
- Bharatanatyam → Test Instructor (b2574ad8)
- Mridangam → Educator 2 (894094ec)
- Tabla → Lakshay
- Sitar → Zaid

### 3. Create batches (3 batches)
- "Carnatic Vocal - Batch A" linked to Carnatic Vocal course + Lakshay
- "Hindustani Vocal - Batch A" linked to Hindustani Vocal + Zaid
- "Bharatanatyam - Batch A" linked to Bharatanatyam + Test Instructor

### 4. Enroll students
- Enroll vikas + Srinivas + Student 1 in Carnatic Vocal
- Enroll vikas in Hindustani Vocal
- Enroll Srinivas in Bharatanatyam
- Add batch enrollments for the same students

### 5. Create course modules & lessons (for Carnatic Vocal)
- Module 1: "Introduction to Carnatic Music" (3 lessons: video, PDF, text)
- Module 2: "Swaras and Ragas" (3 lessons: video, audio via YouTube, PDF)
- Module 3: "Varnam Practice" (2 lessons: video, text)
- Use real public YouTube URLs for Carnatic music content
- Use curriculum-materials bucket references for PDFs

### 6. Fill curriculum sections with mixed media
For 8-10 curriculum modules in semester 1, add sections with:
- **Video** sections (YouTube URLs of Carnatic music lectures)
- **PDF** sections (sample PDF links)
- **Audio** sections (YouTube audio links)
- **Text** sections (rich descriptive content)
- Add curriculum_section_links for multi-resource sections

### 7. Create assignments (3 assignments)
- "Sarali Varisai Practice" for Carnatic Vocal (due in 7 days, with PDF)
- "Raga Identification Quiz" for Carnatic Vocal (due in 14 days, text-based)
- "Composition Analysis" for Hindustani Vocal (due in 10 days)

### 8. Create live classes (3 classes)
- Upcoming Zoom class for Carnatic Vocal batch
- Upcoming Google Meet class for Hindustani Vocal batch
- One completed class (past date)

### 9. Create schedules (5 schedule entries)
- Weekly recurring classes for Carnatic Vocal
- Mix of class, exam, and event types

### 10. Create events (2 events)
- "Annual Music Festival 2026" — upcoming
- "Guest Lecture: Evolution of Ragas" — upcoming

### 11. Create feedback (3 entries)
- Anonymous feedback from students about courses and teaching

### 12. Create sample subject allocations
- Allocate curriculum modules to instructors for academic year 2025-26

## Implementation
All done via the database insert tool — no schema changes needed. Approximately 12-15 insert operations covering all tables. This will populate every dashboard section with realistic data for testing.

