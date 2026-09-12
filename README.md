# Nadagurukulam

# NADA GURUKULAM - COMPLETE LMS & WEBSITE MASTER PROMPT FOR LOVABLE

## 🎯 PROJECT OVERVIEW
Build a premium, modern Learning Management System (LMS) and institutional website for **Nada Gurukulam** - a prestigious Indian classical music and dance institution under Sri Sathya Sai University for Human Excellence. The platform must reflect the institution's cultural heritage while providing cutting-edge educational technology.

---

## 🎨 BRAND IDENTITY & COLOR PALETTE

### Logo Description
- Primary logo features a Bharatanatyam dancer silhouette in circular frame
- Sanskrit motto: "रसो वै सः" (raso vai saḥ - "He is the essence")
- Institutional name: "Nada Gurukulam"

### Official Color Palette
```css
/* PRIMARY COLORS */
--primary-maroon: #8B1A1A;        /* Deep maroon from logo */
--primary-burgundy: #6B0F1A;      /* Darker burgundy */
--primary-maroon-light: #A52A2A;  /* Light maroon for hover states */

/* ACCENT COLORS */
--accent-gold: #D4AF37;           /* Golden yellow from logo */
--accent-gold-light: #F4D03F;     /* Lighter gold */
--accent-gold-dark: #B8942E;      /* Darker gold for text */

/* NEUTRAL COLORS */
--cream: #FFF8E7;                 /* Warm cream background */
--off-white: #FAF6F1;             /* Soft off-white */
--warm-gray: #8B8B8B;             /* Warm gray for text */
--dark-brown: #3E2723;            /* Dark brown for primary text */

/* SEMANTIC COLORS */
--success: #2E7D32;               /* Green for success states */
--warning: #F57C00;               /* Orange for warnings */
--error: #C62828;                 /* Red for errors */
--info: #1976D2;                  /* Blue for information */

/* GRADIENT */
--primary-gradient: linear-gradient(135deg, #8B1A1A 0%, #6B0F1A 100%);
--gold-gradient: linear-gradient(135deg, #F4D03F 0%, #D4AF37 100%);
```

---

## 📱 TECHNICAL REQUIREMENTS

### Tech Stack
- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui components
- **State Management**: Zustand or React Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Video Hosting**: Cloudflare Stream or Vimeo integration
- **Payment Gateway**: Razorpay integration
- **Email Service**: Resend or SendGrid
- **Animations**: Framer Motion
- **Icons**: Lucide React icons
- **Charts**: Recharts for analytics

### Responsive Design Requirements
```
Mobile First Approach:
- Mobile: 320px - 767px (100% width, single column)
- Tablet: 768px - 1023px (Optimized 2-column layouts)
- Desktop: 1024px - 1439px (Full features, 3-column layouts)
- Large Desktop: 1440px+ (Max-width container with proper spacing)

Breakpoints in Tailwind:
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 🌐 COMPLETE WEBSITE STRUCTURE

### 1️⃣ PUBLIC PAGES (No Authentication Required)

#### **Homepage / Landing Page**
**URL**: `/`

**Hero Section**:
- Full-screen hero with background video/image of classical performance
- Animated Sanskrit text: "रसो वै सः" with elegant fade-in
- Main headline: "Nada Gurukulam - Nurturing Talent, Inspiring Excellence"
- Subheadline: "Traditional Guru-Shishya System meets Modern Education"
- Two prominent CTAs:
  - "Explore Courses" (Maroon button with gold hover)
  - "Apply Now" (Gold outlined button)
- Scroll indicator with smooth animation

**Features Section**:
Three-column grid (responsive to single column on mobile):
1. **Traditional Excellence**
   - Icon: Classical dancer or veena icon
   - Text: "50+ Years of Combined Teaching Experience"
   - Link to Faculty page
   
2. **Modern Learning**
   - Icon: Digital learning icon
   - Text: "State-of-the-art Online & Offline Training"
   - Link to LMS features

3. **Global Recognition**
   - Icon: Globe with cultural symbols
   - Text: "Students Performing Worldwide"
   - Link to Student Achievements

**Courses Overview**:
- Horizontal scrollable cards (mobile) / Grid layout (desktop)
- Each course card shows:
  - Beautiful course thumbnail image
  - Course name (Carnatic Vocal, Bharatanatyam, etc.)
  - Brief 2-line description
  - Teacher name with photo
  - "Learn More" CTA
- "View All Courses" button at bottom

**Faculty Showcase**:
- Rotating carousel of faculty members
- Large circular profile photos
- Name, specialization, and top award
- "Meet Our Gurus" CTA button

**Testimonials Section**:
- Video testimonials (embedded YouTube/Vimeo)
- Text testimonials with student photos
- Automated carousel with manual controls
- Star ratings where applicable

**Statistics Counter** (Animated on scroll):
```
500+        |    14         |    30+        |    10+
Students    |  Expert Gurus |  Countries    |  Years
```

**Call-to-Action Section**:
- Rich maroon background with gold accents
- "Begin Your Musical Journey Today"
- Enrollment deadline countdown timer (if applicable)
- "Apply for Admission" primary button

**Footer**:
- Four-column layout (responsive to accordion on mobile):
  - Column 1: About Nada Gurukulam + Logo
  - Column 2: Quick Links (Courses, Faculty, Admissions, LMS Login)
  - Column 3: Courses List
  - Column 4: Contact Information
- Social media icons (YouTube, Instagram, Facebook, LinkedIn)
- Newsletter subscription form
- Copyright notice
- Designed by credit

---

#### **About Us Page**
**URL**: `/about`

**Sections**:

1. **Page Hero**:
   - Title: "About Nada Gurukulam"
   - Sanskrit quote with translation
   - Beautiful full-width image of campus/students

2. **Our Story**:
   - Timeline design showing institution history
   - Founded under Sri Sathya Sai University for Human Excellence
   - Milestone achievements

3. **Vision & Mission**:
   - Two-column layout with icons
   - Vision statement with elaborate description
   - Mission points with supporting details

4. **Founder's Message**:
   - Large profile photo of Sadguru Sri Madhusudan Sai
   - Full message about Nada Brahma philosophy
   - Beautiful quote callout box
   - Signature image

5. **Director's Message**:
   - Profile of Smt Revathi Ramachandran
   - Her vision for the institution
   - Quote callout

6. **Our Philosophy**:
   - Guru-Shishya Parampara explanation
   - Traditional vs Modern education approach
   - Cultural preservation mission

7. **Campus & Facilities** (if applicable):
   - Image gallery
   - Facility descriptions
   - Virtual tour link/video

---

#### **Courses / Programs Page**
**URL**: `/courses`

**Page Structure**:

1. **Hero Section**:
   - "Explore Our Programs"
   - Filter tags: All | Vocal | Instrumental | Dance

2. **Course Categories** (Tabbed or Accordion):

**A. Carnatic Vocal Music**:
- Program overview
- Curriculum highlights
- Learning outcomes
- Faculty teaching this program (with photos)
- Course duration & structure
- Fee structure (if public)
- "Enquire Now" / "Apply" button

**B. Hindustani Vocal Music**:
- Same structure as above

**C. Bharatanatyam Dance**:
- Same structure as above

**D. Instrumental Music**:
- Mridangam
- Tabla
- Flute
- Each with dedicated subsection

3. **Learning Methodology**:
- In-person classes
- Online live sessions
- Recorded lessons
- Practice assignments
- Performance opportunities

4. **Certification**:
- University affiliation details
- Degree/Diploma information
- Sample certificate preview

5. **Admission Process**:
- Step-by-step guide with visual timeline
- Eligibility criteria
- Application deadlines
- Required documents
- Fee payment methods

---

#### **Faculty Page**
**URL**: `/faculty`

**Page Design**:

1. **Hero**: "Meet Our Esteemed Gurus"

2. **Filter Options**:
   - All Faculty
   - Carnatic Vocal
   - Hindustani Vocal
   - Bharatanatyam
   - Instrumental

3. **Featured Faculty** (Director & Lead Teachers):
   - Large cards with extensive details
   - Full biography
   - Education timeline
   - Major achievements
   - "View Full Profile" modal trigger

4. **All Faculty Grid**:
   - Responsive card grid
   - Each card shows:
     - Professional photo
     - Name
     - Specialization
     - Highest qualification
     - Years of experience
     - Top 2 awards
     - "View Profile" button

5. **Faculty Profile Modal/Page**:
   When clicking "View Profile":
   - Full-page overlay or dedicated page
   - Comprehensive biography
   - Education (with institution logos if possible)
   - Complete experience timeline
   - Full awards & accolades list
   - Specialties
   - Performance gallery (photos/videos)
   - Publications (if any)
   - Close/Back button

---

#### **Admissions Page**
**URL**: `/admissions`

**Content**:

1. **Current Admission Cycle**:
   - Academic year information
   - Important dates timeline
   - Application deadline (with countdown)

2. **Eligibility Criteria**:
   - Age requirements
   - Educational qualifications
   - Prior experience (if needed)
   - Separate criteria for each course

3. **Application Process**:
   Numbered steps with icons:
   ```
   Step 1: Create Account → 
   Step 2: Fill Application Form → 
   Step 3: Upload Documents → 
   Step 4: Pay Application Fee → 
   Step 5: Audition/Interview → 
   Step 6: Admission Confirmation
   ```

4. **Required Documents Checklist**:
   - Photo ID proof
   - Educational certificates
   - Passport-size photographs
   - Previous learning certificates (if any)
   - Performance videos (for audition)

5. **Fee Structure**:
   - Transparent table showing:
     - Application fee
     - Tuition fee (semester/annual)
     - Additional charges
     - Payment plans available

6. **Scholarship Information**:
   - Merit-based scholarships
   - Need-based financial aid
   - Application process
   - Eligibility criteria

7. **FAQs Accordion**:
   - Common admission questions
   - Answers with proper formatting

8. **Apply Now CTA**:
   - Prominent button leading to registration/application

---

#### **Gallery Page**
**URL**: `/gallery`

**Sections**:

1. **Filter Tabs**:
   - All | Events | Performances | Workshops | Campus Life

2. **Photo Gallery**:
   - Masonry grid layout
   - Lightbox functionality
   - High-quality images of:
     - Student performances
     - Faculty concerts
     - Cultural events
     - Campus activities
     - Award ceremonies

3. **Video Gallery**:
   - Grid of video thumbnails
   - Embedded YouTube/Vimeo players
   - Categories:
     - Student Performances
     - Faculty Concerts
     - Workshops & Seminars
     - Virtual Tours

4. **Load More** functionality for pagination

---

#### **Contact Page**
**URL**: `/contact`

**Layout**:

1. **Two-Column Layout**:

**Left Column - Contact Form**:
```
Fields:
- Full Name*
- Email Address*
- Phone Number*
- Subject* (Dropdown: General Inquiry | Admissions | Technical Support | Course Information)
- Message* (Textarea)
- Submit Button
```
Form validation with error messages
Success message on submission

**Right Column - Contact Information**:
- **Address**:
  ```
  Nada Gurukulam
  Sathya Sai Grama
  Muddenahalli
  Chikkaballapur
  Karnataka - 562101
  ```
- **Email**: info.nadagurukulam@sssuhe.ac.in
- **Phone**: [Add if available]
- **Office Hours**: Monday - Saturday, 9:00 AM - 5:00 PM

2. **Embedded Google Map**:
   - Full-width interactive map
   - Marked location of campus

3. **Quick Links**:
   - Admissions Inquiry
   - Technical Support
   - General Information

---

#### **Blog/News Page** (Optional but Recommended)
**URL**: `/blog` or `/news`

- Latest news and announcements
- Student achievements
- Faculty accomplishments
- Event reports
- Cultural articles about music/dance

---

### 2️⃣ AUTHENTICATION SYSTEM

#### **Registration Page**
**URL**: `/register`

**Design**:
- Split screen design (50/50 on desktop, full-width on mobile)
- Left side: Beautiful background image with overlay
  - Nada Gurukulam logo
  - Inspiring quote
  - Benefits of joining
- Right side: Registration form

**Registration Form**:
```
Personal Information:
- Full Name*
- Email Address*
- Phone Number*
- Date of Birth*
- Gender* (Dropdown)

Address:
- Country*
- State/Province*
- City*
- Postal Code

Course Interest:
- Select Course* (Multi-select dropdown)
  - Carnatic Vocal
  - Hindustani Vocal
  - Bharatanatyam
  - Mridangam
  - Tabla
  - Flute

Account Security:
- Password* (with strength indicator)
- Confirm Password*

Terms & Conditions:
- Checkbox: "I agree to Terms & Conditions and Privacy Policy"

Submit Button: "Create Account"
```

**After Registration**:
- Success message: "Registration Successful! Please wait for admin approval."
- Automatic email sent to user confirming registration
- Email sent to admin for approval
- Redirect to login page with message

---

#### **Login Page**
**URL**: `/login`

**Design**:
- Similar split-screen design as registration
- Left side: Background with branding
- Right side: Login form

**Login Form**:
```
- Email Address*
- Password*
- Remember Me (Checkbox)
- Forgot Password? (Link)
- Login Button

Divider: "OR"

- Don't have an account? Register here (Link)
```

**Account Status Messages**:
- If pending approval: "Your account is pending admin approval. You will receive an email once approved."
- If rejected: "Your account application was not approved. Please contact admissions."
- If approved: Normal login proceeds

---

#### **Forgot Password Page**
**URL**: `/forgot-password`

**Flow**:
1. Enter email address
2. Submit → Send reset link via email
3. User clicks link in email
4. Reset password page with new password fields
5. Success → Redirect to login

---

### 3️⃣ STUDENT DASHBOARD & LMS

#### **Student Dashboard Overview**
**URL**: `/student/dashboard`

**Required after login and admin approval**

**Top Navigation Bar**:
```
[Logo] | Dashboard | My Courses | Assignments | Progress | Resources | Profile | [Logout]
```

**Sidebar Navigation** (Collapsible on mobile):
```
🏠 Dashboard
📚 My Courses
📝 Assignments
📊 Progress & Reports
🎥 Live Classes
💬 Discussions
📁 Resources
👤 Profile Settings
🔔 Notifications
❓ Help & Support
```

---

#### **Dashboard Home** (`/student/dashboard`)

**Layout**:

1. **Welcome Banner**:
   - "Welcome back, [Student Name]!"
   - Current date and time
   - Quick stats overview

2. **Quick Stats Cards** (4-column grid, responsive):
   ```
   📚 Enrolled Courses: 3
   ✅ Completed Lessons: 45/120
   📝 Pending Assignments: 2
   ⭐ Overall Progress: 68%
   ```

3. **Upcoming Live Classes** (Card):
   - Next 3 scheduled live sessions
   - Course name
   - Teacher name
   - Date & Time
   - "Join Class" button (enabled 10 mins before start)

4. **Recent Activity Feed**:
   - Timeline of recent actions:
     - Lesson completed
     - Assignment submitted
     - New content added
     - Teacher feedback received

5. **Announcements**:
   - Important notices from admin/teachers
   - Event announcements
   - System updates

6. **Progress Overview Chart**:
   - Visual chart showing progress across all courses
   - Weekly/Monthly view toggle

---

#### **My Courses Page** (`/student/courses`)

**View Options**: Grid View | List View

**Course Cards** (for each enrolled course):
```
┌─────────────────────────────────────────┐
│  [Course Thumbnail Image]               │
│                                         │
│  Course Title: Carnatic Vocal - Level 1 │
│  Instructor: Smt. Revathi Ramachandran  │
│                                         │
│  Progress: [████████░░] 75%            │
│                                         │
│  📚 12/16 Lessons Completed             │
│  📝 2 Pending Assignments               │
│  ⏰ Last Accessed: 2 hours ago          │
│                                         │
│  [Continue Learning] [View Details]     │
└─────────────────────────────────────────┘
```

**Filter Options**:
- All Courses
- In Progress
- Completed
- Not Started

---

#### **Individual Course View** (`/student/courses/:courseId`)

**Page Layout**:

**Course Header**:
- Course banner image
- Course title
- Instructor name and photo
- Course description
- Overall progress bar
- Certificate status (if applicable)

**Tabbed Content Area**:

**Tab 1: Curriculum/Lessons**
Accordion-style module structure:
```
Module 1: Basics of Swaras ▼
  └─ Lesson 1.1: Introduction to Sa-Re-Ga-Ma [✓ Completed]
  └─ Lesson 1.2: Understanding Shruti [▶ In Progress]
  └─ Lesson 1.3: Practice Session [🔒 Locked]
  └─ Quiz 1 [📝 Not Attempted]

Module 2: Ragas - Foundation ▼
  └─ Lesson 2.1: Introduction to Ragas [🔒 Locked]
  └─ Lesson 2.2: Mayamalavagowla Raga [🔒 Locked]
  ...
```

Each lesson item shows:
- Lock icon (if not unlocked yet)
- Checkmark (if completed)
- Duration
- Type (Video, PDF, Audio, Assignment)

**Tab 2: Assignments**
List of all assignments:
```
┌───────────────────────────────────────┐
│ Assignment 1: Alankara Practice       │
│ Due Date: March 15, 2025              │
│ Status: ⏳ Pending                     │
│ [View Instructions] [Submit]          │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ Assignment 2: Raga Identification     │
│ Due Date: March 20, 2025              │
│ Status: ✅ Submitted - Awaiting Review│
└───────────────────────────────────────┘
```

**Tab 3: Resources**
Downloadable materials:
- Practice PDFs
- Sheet music
- Audio files
- Reference videos
- External links

**Tab 4: Discussions**
Forum-style discussion board:
- Student can post questions
- Teacher/admin can respond
- Other students can participate
- Threaded conversations

**Tab 5: Announcements**
Course-specific announcements from instructor

---

#### **Lesson Player Page** (`/student/courses/:courseId/lessons/:lessonId`)

**Video Player Interface**:

**Top Section**:
- Lesson title
- Breadcrumb: Course > Module > Lesson

**Main Video Player**:
- Full-featured video player
- Play/Pause
- Volume control
- Playback speed (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Fullscreen mode
- Picture-in-picture
- Quality selector
- Subtitles/Captions (if available)
- Progress bar with chapter markers

**Below Video**:

**Tabs**:
1. **Overview**:
   - Lesson description
   - Learning objectives
   - Key takeaways

2. **Resources**:
   - Downloadable materials specific to this lesson
   - Links to additional resources

3. **Notes**:
   - Personal note-taking area
   - Rich text editor
   - Auto-save functionality
   - Timestamp linking to video

4. **Transcript** (if available):
   - Full text transcript
   - Click to jump to that point in video

**Sidebar** (collapsible):
- Course curriculum with current lesson highlighted
- Previous/Next lesson buttons
- Progress tracker

**Bottom Actions**:
- ✓ Mark as Complete button
- Rate this Lesson (stars)
- Report an Issue

---

#### **Assignments Page** (`/student/assignments`)

**View Options**:
- All Assignments
- Pending
- Submitted
- Graded

**Assignment Card**:
```
┌─────────────────────────────────────────────┐
│ 📝 Assignment: Swara Practice Recording    │
│                                             │
│ Course: Carnatic Vocal - Level 1            │
│ Due Date: March 15, 2025 (3 days left)     │
│                                             │
│ Instructions:                               │
│ Record yourself practicing Mayamalavagowla  │
│ raga alapana for 5 minutes...              │
│                                             │
│ Submission Type: Video/Audio Upload         │
│ Max File Size: 100 MB                       │
│                                             │
│ Status: 🟡 Pending Submission              │
│                                             │
│ [View Full Details] [Submit Assignment]     │
└─────────────────────────────────────────────┘
```

**Assignment Submission Page**:
- Full assignment instructions
- File upload area (drag & drop)
- Text submission area (if applicable)
- Add comments for teacher
- Submit button
- Save as draft option

**Graded Assignment View**:
- Teacher's feedback
- Grade/Score
- Rubric breakdown (if applicable)
- Option to resubmit (if allowed)

---

#### **Progress & Reports** (`/student/progress`)

**Overall Progress Dashboard**:

1. **Course-wise Progress**:
   - Pie chart or bar graph
   - Percentage completed for each course
   - Time spent on each course

2. **Learning Streak**:
   - Calendar heatmap showing daily activity
   - Current streak count
   - Longest streak

3. **Performance Analytics**:
   - Assignment scores trend
   - Quiz performance
   - Attendance in live classes

4. **Certificates**:
   - List of earned certificates
   - Download/Print option
   - Share on social media option

5. **Learning Hours**:
   - Total hours spent learning
   - Monthly breakdown
   - Comparison with other students (anonymized)

---

#### **Live Classes** (`/student/live-classes`)

**Upcoming Classes**:
```
┌──────────────────────────────────────────┐
│ 🎥 Bharatanatyam Adavu Practice Session  │
│                                          │
│ Instructor: Ms. Manasvini Ramachandran   │
│ Date: March 14, 2025                     │
│ Time: 6:00 PM - 7:30 PM IST             │
│                                          │
│ Starts in: 02:15:30                      │
│                                          │
│ [Add to Calendar] [Join Class]           │
└──────────────────────────────────────────┘
```

**Past Classes**:
- List of recorded past sessions
- Watch recording
- Download option

**Live Class Interface** (when joined):
- Video conferencing interface (using Zoom/Google Meet/Custom WebRTC)
- Chat panel
- Raise hand feature
- Screen sharing view
- Recording indicator

---

#### **Resources Library** (`/student/resources`)

**Organized by**:
- Course
- Type (PDF, Video, Audio, Links)
- Recently Added
- Most Downloaded

**Resource Card**:
- File type icon
- Resource name
- Course name
- Date added
- File size
- Download button
- Preview option (for PDFs/images)

**Search & Filter**:
- Full-text search
- Filter by course, type, date

---

#### **Profile Settings** (`/student/profile`)

**Tabs**:

**1. Personal Information**:
- Profile photo upload
- Full name
- Email (read-only)
- Phone number
- Date of birth
- Gender
- Address
- Edit/Save functionality

**2. Account Security**:
- Change password
- Two-factor authentication (optional)
- Login history
- Active sessions

**3. Learning Preferences**:
- Email notification settings
- Preferred learning time
- Accessibility options (font size, high contrast)

**4. Certificates & Achievements**:
- Earned certificates
- Badges/achievements
- Downloadable transcripts

**5. Payment History** (if applicable):
- Transaction history
- Invoices/receipts
- Download option

---

#### **Notifications** (`/student/notifications`)

**Notification Types**:
- New lesson added
- Assignment deadline reminder
- Live class reminder
- Feedback received
- Announcement
- System updates

**Notification Card**:
- Icon based on type
- Title and brief description
- Timestamp
- Mark as read/unread
- Action button (View, Dismiss)

**Settings**:
- Email notifications on/off
- Push notifications on/off
- Notification preferences by type

---

### 4️⃣ ADMIN DASHBOARD

#### **Admin Login**
**URL**: `/admin/login`

Separate admin login page with enhanced security

---

#### **Admin Dashboard Overview** (`/admin/dashboard`)

**Top Navigation**:
```
[Logo] | Dashboard | Users | Courses | Content | Live Classes | Analytics | Settings | [Logout]
```

**Sidebar Navigation**:
```
🏠 Dashboard
👥 User Management
  ├─ All Users
  ├─ Pending Approvals
  ├─ Students
  ├─ Instructors
  └─ Admins
📚 Course Management
  ├─ All Courses
  ├─ Create New Course
  ├─ Categories
  └─ Tags
📝 Content Management
  ├─ Lessons
  ├─ Assignments
  ├─ Resources
  └─ Quizzes
🎥 Live Classes
  ├─ Schedule Class
  ├─ Upcoming Classes
  └─ Past Classes
💳 Payments & Billing
  ├─ Transactions
  ├─ Revenue Reports
  └─ Fee Management
📊 Analytics & Reports
  ├─ User Analytics
  ├─ Course Performance
  ├─ Revenue Analytics
  └─ Custom Reports
📢 Communications
  ├─ Announcements
  ├─ Email Templates
  └─ Notifications
⚙️ Settings
  ├─ General Settings
  ├─ Email Configuration
  ├─ Payment Gateway
  ├─ Appearance
  └─ Security
```

---

#### **Dashboard Home** (`/admin/dashboard`)

**Quick Stats** (4-6 cards):
```
👥 Total Users: 1,234
  ├─ Students: 1,180
  ├─ Instructors: 14
  └─ Admins: 5

📚 Total Courses: 12
  ├─ Published: 10
  └─ Draft: 2

⏳ Pending Approvals: 15

💰 Revenue This Month: ₹5,45,000
```

**Recent Activity Timeline**:
- New registrations
- Course completions
- Payments received
- Support tickets

**Charts & Graphs**:
1. **User Growth Chart** (Line chart)
   - Monthly user registration trend

2. **Revenue Chart** (Bar chart)
   - Monthly revenue comparison

3. **Course Enrollment Chart** (Pie chart)
   - Distribution across courses

4. **Top Performing Courses** (Table)
   - Course name
   - Enrollments
   - Completion rate
   - Revenue

**Quick Actions**:
- Approve Pending Users
- Create New Course
- Schedule Live Class
- Send Announcement
- View All Reports

---

#### **User Management**

##### **All Users Page** (`/admin/users`)

**View Options**:
- Table View (default)
- Card View

**Filter & Search**:
- Search by name, email, phone
- Filter by:
  - Role (Student, Instructor, Admin)
  - Status (Active, Pending, Suspended, Rejected)
  - Registration date range
  - Course enrolled

**User Table Columns**:
```
| Photo | Name | Email | Phone | Role | Status | Registered | Enrolled Courses | Actions |
```

**Actions Dropdown**:
- View Profile
- Edit User
- Approve (if pending)
- Reject (if pending)
- Suspend Account
- Delete User
- Send Email
- View Activity Log

**Bulk Actions**:
- Select multiple users
- Bulk approve
- Bulk reject
- Bulk email
- Export selected

---

##### **Pending Approvals** (`/admin/users/pending`)

**Approval Queue**:
User cards with full registration details:
```
┌─────────────────────────────────────────────┐
│ [Photo]  Rajesh Kumar                       │
│          rajesh@email.com                   │
│          +91 98765 43210                    │
│                                             │
│ Date of Birth: Jan 15, 2005                │
│ Location: Bangalore, Karnataka             │
│ Course Interest: Carnatic Vocal, Mridangam │
│                                             │
│ Registered: March 10, 2025 (3 days ago)    │
│                                             │
│ [✓ Approve] [✗ Reject] [View Full Profile] │
└─────────────────────────────────────────────┘
```

**Approval Actions**:
- Approve with welcome email
- Reject with reason (email sent)
- Request more information
- Bulk approve selected

**Rejection Modal**:
- Reason dropdown
- Custom message field
- Send email checkbox
- Confirm rejection

---

##### **Student Details Page** (`/admin/users/:userId`)

**Student Profile**:
- Full personal information
- Profile photo
- Contact details
- Enrollment history
- Payment history

**Enrolled Courses**:
- List of courses
- Progress in each course
- Assignment submissions
- Grades

**Activity Log**:
- Login history
- Lesson views
- Assignment submissions
- Certificate earned

**Administrative Actions**:
- Edit profile
- Reset password
- Change status
- Assign course
- Revoke course access
- Send email
- Add notes (admin only)

---

#### **Course Management**

##### **All Courses Page** (`/admin/courses`)

**Course List**:
```
┌──────────────────────────────────────────────────┐
│ [Thumbnail] Carnatic Vocal - Foundation Level   │
│                                                  │
│ Instructor: Smt. Revathi Ramachandran          │
│ Status: 🟢 Published                            │
│                                                  │
│ 👥 156 Students Enrolled                        │
│ 📚 24 Lessons | ⏱️ 12 hours                    │
│ ⭐ 4.8 (45 reviews)                             │
│                                                  │
│ Created: Jan 15, 2025 | Updated: Mar 10, 2025  │
│                                                  │
│ [Edit] [Preview] [Analytics] [Delete]           │
└──────────────────────────────────────────────────┘
```

**Filter Options**:
- All Courses
- Published
- Draft
- Archived
- By Instructor
- By Category

---

##### **Create/Edit Course** (`/admin/courses/create` or `/admin/courses/:courseId/edit`)

**Multi-Step Form**:

**Step 1: Basic Information**
```
Course Title*:
Course Subtitle:
Category*: [Dropdown]
Instructor*: [Dropdown - select from faculty]
Course Level: Beginner | Intermediate | Advanced
Language: English | Hindi | Kannada | Tamil | Telugu

Short Description*: (150 characters)
Long Description*: (Rich text editor)

Course Thumbnail*: [Upload Image - 16:9 ratio]
Promotional Video: [Upload or YouTube link]
```

**Step 2: Curriculum Builder**
Drag-and-drop interface:
```
Module 1: [Module Title]
  └─ Add Lesson
  └─ Add Quiz
  └─ Add Assignment
  └─ Reorder items

[+ Add Module]
```

**Lesson Creation Modal**:
```
Lesson Title*:
Lesson Type*: Video | PDF | Audio | Text | External Link

[If Video]:
  - Upload Video or YouTube/Vimeo URL
  - Video Duration (auto-detected)
  - Subtitles file (optional)

[If PDF]:
  - Upload PDF
  - Allow Download: Yes/No

Description: (Rich text editor)
Resources: [Attach files]

Preview Before: [Checkbox] (Make this lesson freely previewable)
```

**Step 3: Pricing & Enrollment**
```
Course Price: Free | Paid
[If Paid]:
  - Regular Price*: ₹
  - Discount Price: ₹
  - Valid Until: [Date]

Enrollment Limit: Unlimited | [Number]
Enrollment Period: Always Open | Custom Dates
  [If Custom]:
    - Start Date:
    - End Date:

Prerequisites: [Select courses]
Certificate on Completion: Yes | No
[If Yes]:
  - Certificate Template: [Select template]
```

**Step 4: Settings & Publish**
```
Course Access: After Enrollment | After Approval
Drip Content: Yes | No
[If Yes]:
  - Unlock 1 module per: [Number] days

Discussion Forum: Enable | Disable
Q&A Section: Enable | Disable
Student Reviews: Enable | Disable

SEO Settings:
  - Meta Title:
  - Meta Description:
  - Keywords:

[Save as Draft] [Publish Course]
```

---

##### **Course Analytics** (`/admin/courses/:courseId/analytics`)

**Dashboard showing**:
- Total enrollments (trend chart)
- Active learners
- Completion rate
- Average progress
- Drop-off points (which lessons students quit)
- Student satisfaction (ratings & reviews)
- Revenue generated
- Most popular lessons
- Forum activity

---

#### **Content Management**

##### **Lessons Library** (`/admin/content/lessons`)

**All lessons across all courses**:
- Search and filter
- Edit lesson
- View usage (which courses it's in)
- Replace video
- Update description
- View analytics

---

##### **Assignments** (`/admin/content/assignments`)

**Assignment List**:
- All assignments across courses
- Filter by course, status, due date

**Assignment Details**:
- Assignment title and instructions
- Due date
- Submission type
- Attached resources
- Rubric/grading criteria
- Submissions overview

**Review Submissions**:
```
Student: Priya Sharma
Submitted: March 12, 2025 (On time)
Submission: [Video file - 45 MB]
Student Comments: "Please review my raga practice..."

[View/Download Submission]

Grading:
  Score: [___] / 100
  Feedback: [Rich text editor]
  [Save Grade] [Return for Revision]
```

---

#### **Live Classes Management**

##### **Schedule Live Class** (`/admin/live-classes/schedule`)

**Form**:
```
Class Title*:
Course*: [Select course]
Instructor*: [Select instructor]

Date*: [Calendar picker]
Start Time*: [Time picker]
Duration*: [Hours:Minutes]

Platform: Zoom | Google Meet | Microsoft Teams | Custom
[If Zoom/Meet]:
  - Auto-generate meeting link: [Checkbox]
  - OR
  - Paste Meeting Link:

Max Participants: Unlimited | [Number]
Recording: Enable | Disable

Description: [Rich text editor]

Notification:
  - Send email notification: [Checkbox]
  - Send 1 hour before class: [Checkbox]

[Save] [Save & Notify Students]
```

---

##### **Upcoming Classes** (`/admin/live-classes/upcoming`)

**Class List**:
- Scheduled classes in chronological order
- Edit/Cancel/Reschedule options
- View registered students
- Send reminder
- Start class (redirects to meeting platform)

---

#### **Analytics & Reports**

##### **User Analytics** (`/admin/analytics/users`)

**Metrics**:
- Total users (with growth rate)
- Active users (daily/weekly/monthly)
- New registrations (trend)
- User retention rate
- Churn rate
- Geographic distribution (map)
- Demographics (age, gender)

**Charts**:
- User growth over time
- Active vs inactive users
- Registration sources

---

##### **Course Performance** (`/admin/analytics/courses`)

**Per Course Metrics**:
- Enrollment count
- Completion rate
- Average time to complete
- Student ratings
- Revenue per course
- Most/least engaging lessons

**Comparative Analysis**:
- Course performance comparison
- Instructor performance comparison

---

##### **Revenue Analytics** (`/admin/analytics/revenue`)

**Financial Metrics**:
- Total revenue
- Revenue by course
- Revenue by month
- Payment method breakdown
- Refunds and cancellations
- Revenue forecasting

**Charts**:
- Revenue trend line
- Course revenue pie chart
- Monthly comparison bar chart

---

##### **Custom Reports** (`/admin/analytics/custom`)

**Report Builder**:
- Select metrics
- Date range
- Filters
- Group by
- Export format (PDF, Excel, CSV)

---

#### **Communications**

##### **Announcements** (`/admin/communications/announcements`)

**Create Announcement**:
```
Title*:
Content*: [Rich text editor]
Target Audience*: 
  - All Users
  - All Students
  - Specific Course Students
  - All Instructors

Priority: Low | Normal | High | Urgent
Display On:
  - Website homepage
  - Student dashboard
  - Email notification

Publish: Immediately | Schedule
[If Schedule]:
  - Publish Date & Time:

Expiry Date: [Optional]

[Save as Draft] [Publish]
```

---

##### **Email Templates** (`/admin/communications/emails`)

**Template Types**:
- Welcome Email (new user)
- Approval Email
- Rejection Email
- Password Reset
- Course Enrollment
- Assignment Reminder
- Payment Receipt
- Certificate Issued
- Custom Templates

**Template Editor**:
- Subject line
- Email body (HTML editor)
- Variable placeholders: {{name}}, {{course}}, {{date}}, etc.
- Preview function
- Test email

---

#### **Settings**

##### **General Settings** (`/admin/settings/general`)
- Site Name
- Site Logo
- Favicon
- Tagline
- Contact Information
- Social Media Links
- Time Zone
- Date Format
- Language

##### **Email Configuration** (`/admin/settings/email`)
- SMTP Settings
- From Email
- From Name
- Email Templates

##### **Payment Gateway** (`/admin/settings/payment`)
- Razorpay API keys
- Payment modes
- Currency
- Tax settings

##### **Appearance** (`/admin/settings/appearance`)
- Color scheme (use brand colors)
- Font selection
- Homepage layout options
- Footer content

##### **Security** (`/admin/settings/security`)
- Password policies
- Session timeout
- Two-factor authentication
- Login attempt limits
- IP whitelist/blacklist

---

## 🎯 KEY FEATURES & FUNCTIONALITY

### 1. USER ROLES & PERMISSIONS

**Super Admin**:
- Full system access
- Manage all users (students, instructors, admins)
- Configure system settings
- Access all analytics
- Manage payments and billing

**Admin**:
- Manage courses and content
- Approve/reject student registrations
- View analytics and reports
- Manage announcements
- Limited settings access

**Instructor**:
- Create and manage assigned courses
- Upload lessons and resources
- Create assignments and quizzes
- Grade student work
- View student progress in their courses
- Conduct live classes

**Student**:
- View and enroll in courses (after approval)
- Access course content
- Submit assignments
- Participate in discussions
- Track progress
- Earn certificates

---

### 2. COURSE PROGRESSION SYSTEM

**Sequential Learning**:
- Lessons unlock in order
- Must complete previous lesson to proceed
- Can revisit completed lessons anytime

**Progress Tracking**:
- Real-time progress updates
- Visual progress bars
- Completion badges

**Drip Content** (Optional per course):
- Release content on schedule
- X lessons per week
- Based on enrollment date

---

### 3. ASSESSMENT SYSTEM

**Assignments**:
- Multiple submission types (file upload, text, video, audio)
- Deadline management
- Late submission handling
- Grading rubrics
- Teacher feedback
- Resubmission option

**Quizzes** (Optional):
- Multiple choice
- True/False
- Fill in the blanks
- Auto-grading
- Instant feedback
- Time limits
- Attempt limits

**Practical Assessments**:
- Video/audio recording submission
- Performance evaluation by instructor
- Feedback with timestamps

---

### 4. CERTIFICATION SYSTEM

**Certificate Generation**:
- Auto-generated upon course completion
- Customizable templates with institution branding
- Unique certificate ID
- QR code for verification
- Digital signature
- PDF download
- Shareable on LinkedIn/social media

**Certificate Verification Portal**:
- Public verification page
- Enter certificate ID to verify authenticity

---

### 5. PAYMENT & BILLING

**Payment Gateway Integration** (Razorpay):
- Credit/Debit cards
- UPI
- Net Banking
- Wallets

**Payment Features**:
- One-time payment
- Installment plans
- Course bundles/packages
- Discount coupons
- Automatic invoicing
- Payment receipts via email
- Refund processing

---

### 6. COMMUNICATION FEATURES

**Discussion Forums**:
- Course-level forums
- Threaded discussions
- Instructor moderation
- File attachments
- Likes/upvotes
- Mark as answered

**Direct Messaging**:
- Student ↔ Instructor messaging
- Admin broadcast messages
- Email integration

**Announcements**:
- System-wide or course-specific
- Priority levels
- Read receipts
- Email notifications

---

### 7. LIVE CLASS FEATURES

**Video Conferencing**:
- Integrated or third-party (Zoom/Meet)
- Screen sharing
- Chat functionality
- Raise hand
- Recording option
- Attendance tracking

**Scheduling**:
- Calendar integration
- Automatic reminders
- Timezone handling

---

### 8. SEARCH & FILTER

**Global Search**:
- Search across courses, lessons, resources
- Autocomplete suggestions
- Search history

**Advanced Filters**:
- Multi-criteria filtering
- Save filter presets
- Export filtered results

---

### 9. NOTIFICATIONS SYSTEM

**Notification Types**:
- Email notifications
- In-app notifications
- Push notifications (if PWA)

**Notification Triggers**:
- New course enrollment
- Assignment deadline
- Live class reminder
- New announcement
- Feedback received
- Certificate earned

**User Preferences**:
- Customize notification settings
- Opt-in/opt-out options
- Frequency control

---

### 10. MOBILE RESPONSIVENESS

**Mobile-First Design**:
- Touch-friendly interface
- Swipe gestures
- Optimized forms
- Collapsible navigation
- Bottom navigation for mobile
- Reduced data consumption
- Offline capability (PWA)

**Responsive Breakpoints**:
```css
Mobile: 320px - 767px
  - Single column layouts
  - Hamburger menu
  - Full-width cards
  - Stacked forms

Tablet: 768px - 1023px
  - Two-column layouts
  - Sidebar toggleable
  - Grid cards (2 per row)

Desktop: 1024px+
  - Multi-column layouts
  - Fixed sidebar
  - Grid cards (3-4 per row)
  - Hover interactions
```

---

### 11. ACCESSIBILITY FEATURES

**WCAG 2.1 AA Compliance**:
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus indicators
- Color contrast ratios
- Resizable text
- Alt text for images
- Skip to content links

---

### 12. SEO OPTIMIZATION

**On-Page SEO**:
- Semantic HTML
- Meta tags (title, description, keywords)
- Open Graph tags
- Twitter Card tags
- Schema.org markup for courses
- Sitemap.xml
- Robots.txt
- Clean URLs

**Performance**:
- Image optimization (WebP, lazy loading)
- Code splitting
- Minification
- Caching strategies
- CDN integration

---

### 13. SECURITY FEATURES

**Authentication**:
- Secure password hashing
- JWT tokens
- Session management
- Remember me functionality
- Password strength requirements
- Account lockout after failed attempts

**Data Protection**:
- HTTPS/SSL
- CSRF protection
- XSS prevention
- SQL injection prevention
- Input validation
- Data encryption

**Privacy**:
- GDPR compliance
- Privacy policy
- Terms of service
- Cookie consent
- Data deletion requests

---

## 🎨 DESIGN SYSTEM

### Typography

```css
/* Headings */
h1: font-size: 2.5rem (40px) | font-weight: 700 | line-height: 1.2
h2: font-size: 2rem (32px) | font-weight: 600 | line-height: 1.3
h3: font-size: 1.75rem (28px) | font-weight: 600 | line-height: 1.4
h4: font-size: 1.5rem (24px) | font-weight: 600 | line-height: 1.4
h5: font-size: 1.25rem (20px) | font-weight: 500 | line-height: 1.5
h6: font-size: 1rem (16px) | font-weight: 500 | line-height: 1.5

/* Body Text */
body: font-size: 16px | font-weight: 400 | line-height: 1.6
small: font-size: 14px

/* Font Family */
Primary: 'Inter', 'Segoe UI', sans-serif
Headings (optional): 'Playfair Display' or 'Cormorant Garamond' for elegant headers
Devanagari: 'Noto Sans Devanagari' for Sanskrit text
```

### Spacing Scale

```css
--spacing-xs: 0.25rem (4px)
--spacing-sm: 0.5rem (8px)
--spacing-md: 1rem (16px)
--spacing-lg: 1.5rem (24px)
--spacing-xl: 2rem (32px)
--spacing-2xl: 3rem (48px)
--spacing-3xl: 4rem (64px)
```

### Border Radius

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px (for circular elements)
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

### Button Styles

**Primary Button** (Maroon):
```css
background: var(--primary-maroon);
color: white;
padding: 12px 24px;
border-radius: var(--radius-md);
hover: background: var(--primary-maroon-light);
```

**Secondary Button** (Gold Outlined):
```css
background: transparent;
border: 2px solid var(--accent-gold);
color: var(--accent-gold-dark);
padding: 12px 24px;
border-radius: var(--radius-md);
hover: background: var(--accent-gold); color: white;
```

**Tertiary Button** (Text only):
```css
background: transparent;
color: var(--primary-maroon);
padding: 12px 24px;
hover: background: rgba(139, 26, 26, 0.1);
```

### Form Elements

**Input Fields**:
```css
border: 1px solid #D1D5DB;
border-radius: var(--radius-md);
padding: 12px 16px;
focus: border-color: var(--primary-maroon); outline: 2px solid rgba(139, 26, 26, 0.2);
```

**Dropdowns**:
- Custom styled select elements
- Multi-select with checkboxes
- Searchable dropdowns for long lists

---

## 🎬 ANIMATIONS & INTERACTIONS

**Page Transitions**:
- Fade in on page load
- Smooth scrolling
- Parallax effects on hero sections

**Micro-interactions**:
- Button hover states (scale, color change)
- Card hover elevation
- Loading states (skeleton screens)
- Success/error messages (toast notifications)
- Progress indicators

**Scroll Animations** (using Framer Motion):
- Fade in on scroll
- Slide in from sides
- Stagger animations for lists
- Number counter animations for stats

---

## 📊 DATA MODELS (Database Schema)

### Users Table
```sql
id (UUID, PK)
email (unique)
password_hash
full_name
phone
date_of_birth
gender
country
state
city
postal_code
profile_photo_url
role (enum: 'student', 'instructor', 'admin', 'super_admin')
status (enum: 'pending', 'approved', 'rejected', 'suspended')
created_at
updated_at
last_login
```

### Courses Table
```sql
id (UUID, PK)
title
subtitle
slug (unique)
description_short
description_long
thumbnail_url
promo_video_url
instructor_id (FK → users.id)
category_id (FK → categories.id)
level (enum: 'beginner', 'intermediate', 'advanced')
language
price
discounted_price
enrollment_limit
enrollment_start_date
enrollment_end_date
is_published
certificate_enabled
created_at
updated_at
```

### Course_Modules Table
```sql
id (UUID, PK)
course_id (FK → courses.id)
title
description
order_index
created_at
updated_at
```

### Lessons Table
```sql
id (UUID, PK)
module_id (FK → course_modules.id)
title
description
type (enum: 'video', 'pdf', 'audio', 'text', 'external_link')
content_url
duration (in seconds)
order_index
is_preview (boolean)
created_at
updated_at
```

### Enrollments Table
```sql
id (UUID, PK)
user_id (FK → users.id)
course_id (FK → courses.id)
enrollment_date
completion_date
progress_percentage
status (enum: 'active', 'completed', 'dropped')
created_at
updated_at
```

### Progress Table
```sql
id (UUID, PK)
user_id (FK → users.id)
lesson_id (FK → lessons.id)
completed (boolean)
completed_at
time_spent (in seconds)
created_at
updated_at
```

### Assignments Table
```sql
id (UUID, PK)
course_id (FK → courses.id)
title
instructions
due_date
submission_type (enum: 'file', 'text', 'video', 'audio')
max_score
created_at
updated_at
```

### Submissions Table
```sql
id (UUID, PK)
assignment_id (FK → assignments.id)
user_id (FK → users.id)
submitted_at
submission_url (file/video/audio URL)
submission_text
score
feedback
graded_by (FK → users.id)
graded_at
status (enum: 'submitted', 'graded', 'returned')
created_at
updated_at
```

### Payments Table
```sql
id (UUID, PK)
user_id (FK → users.id)
course_id (FK → courses.id)
amount
currency
payment_method
razorpay_order_id
razorpay_payment_id
status (enum: 'pending', 'successful', 'failed', 'refunded')
created_at
updated_at
```

### Certificates Table
```sql
id (UUID, PK)
user_id (FK → users.id)
course_id (FK → courses.id)
certificate_id (unique string)
issue_date
certificate_url (PDF URL)
created_at
```

### Announcements Table
```sql
id (UUID, PK)
title
content
target_audience (enum: 'all', 'students', 'instructors', 'course_specific')
course_id (FK → courses.id, nullable)
priority (enum: 'low', 'normal', 'high', 'urgent')
published_at
expires_at
created_by (FK → users.id)
created_at
updated_at
```

### Live_Classes Table
```sql
id (UUID, PK)
course_id (FK → courses.id)
instructor_id (FK → users.id)
title
description
scheduled_date
start_time
duration (in minutes)
meeting_platform (enum: 'zoom', 'google_meet', 'custom')
meeting_url
recording_url
max_participants
created_at
updated_at
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with React + TypeScript + Tailwind
- [ ] Design system implementation (colors, typography, components)
- [ ] Supabase project setup
- [ ] Database schema creation
- [ ] Authentication system (login, register, forgot password)
- [ ] Basic routing structure

### Phase 2: Public Website (Week 3-4)
- [ ] Homepage/Landing page
- [ ] About Us page
- [ ] Courses page
- [ ] Faculty page
- [ ] Admissions page
- [ ] Contact page
- [ ] Gallery page
- [ ] Footer with all sections
- [ ] Mobile responsive testing

### Phase 3: Admin Dashboard - Core (Week 5-6)
- [ ] Admin login and authentication
- [ ] Admin dashboard home
- [ ] User management (list, view, edit, delete)
- [ ] Pending approvals system
- [ ] Basic course CRUD operations

### Phase 4: Admin Dashboard - Advanced (Week 7-8)
- [ ] Complete course builder with curriculum
- [ ] Lesson management
- [ ] Assignment creation and grading
- [ ] Live class scheduling
- [ ] Analytics dashboard
- [ ] Announcement system

### Phase 5: Student LMS - Core (Week 9-10)
- [ ] Student registration and approval flow
- [ ] Student dashboard
- [ ] My Courses page
- [ ] Course view with curriculum
- [ ] Video player with progress tracking
- [ ] Lesson completion system

### Phase 6: Student LMS - Advanced (Week 11-12)
- [ ] Assignment submission and viewing
- [ ] Progress tracking and reports
- [ ] Live class joining
- [ ] Discussion forums
- [ ] Notifications system
- [ ] Profile management

### Phase 7: Payment & Certification (Week 13)
- [ ] Razorpay integration
- [ ] Payment flow
- [ ] Invoice generation
- [ ] Certificate generation
- [ ] Certificate verification portal

### Phase 8: Testing & Optimization (Week 14-15)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Accessibility testing
- [ ] Security audit
- [ ] Bug fixes

### Phase 9: Launch Preparation (Week 16)
- [ ] Content population
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Training materials
- [ ] Deployment setup
- [ ] Go-live!

---

## 📝 IMPORTANT IMPLEMENTATION NOTES

### Video Hosting
Use Cloudflare Stream or Vimeo for video hosting. Store only video IDs in database, not full URLs. Implement DRM if needed for content protection.

### File Storage
All user uploads (assignments, profile photos, documents) should go to Supabase Storage with proper access policies.

### Email System
Use Resend or SendGrid for transactional emails. Create reusable email templates with variables.

### Search Functionality
Implement full-text search using Supabase's built-in search or integrate Algolia for advanced search.

### Caching
Implement proper caching strategies:
- Static assets: Long-term caching
- API responses: Short-term caching with revalidation
- User-specific data: No caching

### Error Handling
Implement comprehensive error handling:
- User-friendly error messages
- Error logging to monitoring service (Sentry)
- Fallback UI for failed states

### Loading States
Always show loading indicators:
- Skeleton screens for initial page loads
- Spinners for button actions
- Progress bars for file uploads

### Form Validation
Use Zod for runtime validation:
- Client-side validation for immediate feedback
- Server-side validation for security
- Clear error messages

---

## 🎯 SUCCESS METRICS

After launch, track these KPIs:
- User registration and approval rate
- Course enrollment rate
- Course completion rate
- Student engagement (time spent, lessons viewed)
- Assignment submission rate
- Live class attendance
- Student satisfaction (ratings/reviews)
- Payment conversion rate
- System performance (page load times)

 I have attached logo also .

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nadagurukulam.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c7f064ad-97ca-4942-8f0d-6d4977336b5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
