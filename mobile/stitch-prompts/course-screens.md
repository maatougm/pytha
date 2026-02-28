# School Hub - Stitch UI Design Prompts

This document contains detailed prompts for Google Stitch UI design tool to create the School Hub mobile app screens.

**Project:** School Hub (Pythagore/Minivirson) - School Messaging System  
**Platform:** React Native Mobile App (iOS & Android)  
**Design System:** Modern educational app with card-based layout  

---

## Color Palette Reference

| Role | Primary Color | Usage |
|------|---------------|-------|
| All | `#1e1e8a` (Deep Blue) | Primary buttons, headers, icons |
| All | `#FFFFFF` (White) | Backgrounds, cards |
| All | `#F5F7FA` (Light Gray) | Screen backgrounds |
| All | `#E8ECF4` (Border Gray) | Card borders, dividers |
| Student | `#4CAF50` (Green) | Progress indicators, success states |
| Teacher | `#FF9800` (Orange) | Pending items, attention |
| Parent | `#9C27B0` (Purple) | Status indicators |
| Admin | `#2196F3` (Blue) | Analytics, system stats |
| All | `#FF5252` (Red) | Urgent, unread badges |

---

## Prompt 1: Home Dashboard Screen

### Base Prompt

```
Mobile home dashboard screen for School Hub educational app - Student role view

Key Features:
- Top header with "Good morning, Sarah!" welcome message and user avatar (circular, 48px)
- Notification bell icon with red badge showing "3" unread notifications
- Horizontal scrollable stats cards row with 3 cards:
  * "Upcoming Classes" card with blue clock icon, showing "2 Today" with light blue background
  * "Pending Assignments" card with orange document icon, showing "4 Due" with light orange background
  * "Unread Messages" card with purple chat icon, showing "7 New" with light purple background
- Section title "Today's Schedule" with "View All" link on right
- Vertical timeline showing 3 class sessions:
  * 9:00 AM - Mathematics (Mr. Johnson) - Blue indicator
  * 11:00 AM - Physics Lab (Dr. Chen) - Green indicator
  * 2:00 PM - English Literature (Ms. Davis) - Purple indicator
  * Each timeline item shows subject, teacher name, time, and classroom location
- Section title "Recent Activity" with activity feed cards:
  * "New assignment posted in Mathematics" - 10 min ago
  * "Grade posted: Physics Quiz" - 2 hours ago
  * "Message from Ms. Davis" - 5 hours ago
- Floating quick action button (FAB) at bottom right with plus icon for quick actions
- Bottom navigation bar with 5 icons: Home (active), Courses, Messages, Calendar, Profile

Visual Style:
- Deep blue (#1e1e8a) as primary color for header, active states, and key buttons
- Clean white card backgrounds with subtle shadow (elevation 2)
- Light gray (#F5F7FA) screen background for contrast
- Modern sans-serif typography, hierarchy with bold headings
- Rounded corners on all cards (12px radius)
- Color-coded timeline indicators matching subject categories
- Status badges with soft pastel backgrounds

Platform: React Native mobile (375px width, iOS-style)
Style: Modern educational, card-based layout, clean and professional
```

### Role Variations

#### Teacher Role Dashboard

```
Mobile home dashboard screen for School Hub educational app - Teacher role view

Key Features:
- Welcome header "Welcome back, Mr. Johnson!" with profile avatar
- Stats cards showing:
  * "Today's Classes" with "4 Sessions" (blue)
  * "Pending Grading" with "12 Assignments" (orange)
  * "Parent Messages" with "3 Unread" (purple)
- "Quick Actions" row with 3 buttons: "Take Attendance", "Post Assignment", "Send Message"
- Today's Schedule section showing 4 class periods with room numbers
- "Needs Attention" section highlighting:
  * 5 assignments awaiting grading
  * 2 parent meeting requests
  * 1 student absence report
- Recent student submissions feed
- Bottom navigation: Home, My Classes, Messages, Schedule, Profile

Visual Style:
- Deep blue (#1e1e8a) primary, white cards with soft shadows
- Orange accent (#FF9800) for pending/action-required items
- Professional, organized layout with clear priority indicators

Platform: React Native mobile (375px)
Style: Modern educational, teacher-focused productivity dashboard
```

#### Parent Role Dashboard

```
Mobile home dashboard screen for School Hub educational app - Parent role view

Key Features:
- Welcome "Hello, Mrs. Anderson!" with multi-child selector dropdown
- Child status cards showing:
  * Emma (Grade 10): 2 upcoming assignments, attendance 98%
  * Jake (Grade 7): 1 overdue assignment, attendance 95%
- Quick stats across all children:
  * "Upcoming Events" with "3 This Week" (blue)
  * "Unread Updates" with "5 Messages" (purple)
  * "Attendance Alerts" with "1 Absence" (red)
- "This Week at a Glance" timeline with school events
- "Recent from Teachers" section with latest communications
- Grade/progress mini-charts for each child
- Bottom navigation: Home, Children, Messages, Calendar, Profile

Visual Style:
- Deep blue (#1e1e8a) primary with purple (#9C27B0) accents
- Family-friendly, warm design with clear child separation
- Green checkmarks for positive status, red alerts for attention needed

Platform: React Native mobile (375px)
Style: Modern educational, parent portal with multi-child support
```

#### Admin Role Dashboard

```
Mobile home dashboard screen for School Hub educational app - Admin role view

Key Features:
- Admin header "School Hub Admin" with institution logo
- System overview cards showing:
  * "Total Users" with "1,247 Active" (blue)
  * "Active Classes" with "48 Running" (green)
  * "Pending Approvals" with "12 Items" (orange)
  * "System Status" with "Operational" (green badge)
- Quick action grid: "User Management", "Course Setup", "Reports", "Announcements"
- Analytics preview with mini charts for:
  * Daily active users (trending up)
  * New enrollments this week
  * Message volume
- "Recent System Activity" log showing latest admin actions
- "Requires Attention" alerts for moderation or technical issues
- Bottom navigation: Dashboard, Users, Courses, Analytics, Settings

Visual Style:
- Deep blue (#1e1e8a) primary with analytics-focused blue (#2196F3) accents
- Data-dense but organized layout
- Traffic light color system: green (good), orange (caution), red (urgent)

Platform: React Native mobile (375px)
Style: Modern educational, admin dashboard with system overview
```

---

## Prompt 2: Course List/Catalog Screen

```
Mobile course catalog screen for School Hub educational app - Browse and discover courses

Key Features:
- Sticky search bar at top with:
  * Search icon on left
  * Placeholder text "Search courses, teachers, or subjects..."
  * Voice search icon on right
  * Filter button (funnel icon) at right end
- Horizontal filter chips scrollable row below search:
  * "All" (active/selected with blue background)
  * "Enrolled" (white background)
  * "Mathematics" (white background)
  * "Science" (white background)
  * "Languages" (white background)
  * "Arts" (white background)
  * "+ More" option
- Section title "My Courses" with count badge showing "4"
- Vertical scrollable list of course cards (2-column grid on tablet, single column on mobile):

Course Card Design (each card):
- Rounded rectangle card with white background, 16px padding
- Course thumbnail image at top (16:9 aspect ratio, rounded corners)
- Department badge overlay on image (e.g., "SCIENCE" in small caps, semi-transparent)
- Course name in bold (e.g., "Advanced Physics")
- Teacher name with small avatar (e.g., "Dr. Sarah Chen")
- Progress indicator for enrolled courses:
  * Progress bar showing percentage (e.g., "65% Complete")
  * Green fill for completed portion, gray for remaining
- Enrollment status badge:
  * "Enrolled" - Green badge with checkmark
  * "In Progress" - Blue badge
  * "Available" - Gray outline badge with "Enroll" text
- Star rating (optional) showing course rating

Example Courses to Display:
1. Advanced Physics - Dr. Chen - 65% Complete - Enrolled
2. World History - Mr. Martinez - 30% Complete - Enrolled
3. Creative Writing - Ms. Johnson - Not started - Enrolled
4. Computer Science - Prof. Williams - Available to enroll
5. Biology 101 - Dr. Park - Available to enroll
6. Spanish II - Señora Garcia - Available to enroll

- Pull-to-refresh indicator at top
- "Load More" button at bottom for pagination
- Empty state illustration for "No courses found" with search suggestions
- Bottom navigation bar (same as dashboard)

Visual Style:
- Deep blue (#1e1e8a) for active filters, primary buttons
- White cards with subtle shadow and 1px border (#E8ECF4)
- Light gray (#F5F7FA) background
- Consistent 16px spacing between cards
- Hover/active states with slight elevation increase
- Department color coding (optional):
  * Science: Teal accents
  * Mathematics: Blue accents
  * Languages: Purple accents
  * Arts: Pink accents

Platform: React Native mobile (375px), responsive grid
Style: Modern educational, catalog browsing, card-based masonry layout
```

---

## Prompt 3: Course Detail Screen

```
Mobile course detail screen for School Hub educational app - Individual course view

Key Features:
- Hero section at top:
  * Full-width course banner image (aspect ratio 16:9) with gradient overlay
  * Back button (chevron left) at top left, white
  * Share button at top right, white
  * Course title "Advanced Physics" overlaid on image with shadow
  * Department badge "SCIENCE" in top-left of image

- Course Info Section (below hero):
  * Teacher info row with circular avatar (56px), name "Dr. Sarah Chen", title "Physics Department Head"
  * Schedule info: "Mon, Wed, Fri • 10:00 AM - 11:30 AM • Room 302"
  * Small icons for schedule, time, location
  * Enrollment status: "You are enrolled" with green checkmark badge
  * "12 Students Enrolled" with avatar stack showing 3 student faces + "+9"

- Tab Navigation (sticky below hero):
  * 4 tabs in horizontal row: "Overview" (active), "Assignments", "Materials", "Classmates"
  * Active tab has blue underline indicator (#1e1e8a)
  * Smooth transition between tabs

- Tab Content - Overview (default view):
  * "About This Course" section with course description text (2-3 paragraphs)
  * "What You'll Learn" section with checkmark list:
    - Understand fundamental physics principles
    - Apply mathematical models to physical systems
    - Conduct laboratory experiments and analyze data
  * "Prerequisites" callout box with required courses
  * "Course Schedule" mini calendar showing key dates
  * "Instructor Bio" expandable section

- Tab Content - Assignments (when selected):
  * List of upcoming assignments with due dates
  * Each assignment card shows: title, due date, status (pending/submitted/graded), points
  * Progress indicator showing overall assignment completion

- Tab Content - Materials (when selected):
  * Grid of downloadable resources (PDFs, videos, links)
  * Each material card: icon, filename, file size, download button
  * Categories: Lecture Notes, Reading Materials, Video Lectures, Practice Problems

- Tab Content - Classmates (when selected):
  * Grid of student profile cards
  * Each card: avatar, name, role (if any)
  * "Message" button on each card
  * Total count "12 Classmates"

- Floating Action Button at bottom:
  * Large primary button "Continue Learning" (if enrolled)
  * Or "Enroll in Course" with price (if not enrolled)

- Bottom spacing for safe area (iOS home indicator)

Visual Style:
- Hero image with dark gradient overlay (black 40% opacity at bottom)
- Deep blue (#1e1e8a) for primary actions, active tabs, accents
- White background for content sections
- Light gray (#F5F7FA) for section backgrounds
- Subtle divider lines between sections (#E8ECF4)
- Card-based layout for list items with 8px border radius
- Professional academic aesthetic with modern mobile patterns
- Tab underline animation on selection

Platform: React Native mobile (375px)
Style: Modern educational, immersive course experience, scrollable detail view
```

---

## Usage Instructions

### How to Use These Prompts in Google Stitch

1. **Access Google Stitch:** Visit [stitch.withgoogle.com](https://stitch.withgoogle.com)

2. **Generate Each Screen:**
   - Copy the base prompt for each screen
   - Paste into Stitch's prompt input
   - Add any role-specific customizations if needed
   - Click generate

3. **Iterate and Refine:**
   - Use Stitch's annotation feature to make targeted changes
   - Generate variants to explore different layouts
   - Refine colors and spacing as needed

4. **Export for Development:**
   - Export designs to Figma for design system integration
   - Export to HTML/CSS for developer handoff
   - Use as reference for React Native implementation

### Tips for Best Results

- **Start with the Student role** as the primary design
- **Generate role variations** by modifying the stats and content sections
- **Use consistent spacing** (8px grid system) across all screens
- **Maintain color consistency** with the deep blue primary color
- **Test at multiple breakpoints** (375px mobile, 768px tablet)

---

## Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1e1e8a` | Primary buttons, headers, active states |
| `--color-background` | `#F5F7FA` | Screen backgrounds |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-border` | `#E8ECF4` | Dividers, borders |
| `--color-text-primary` | `#1A1A2E` | Main text |
| `--color-text-secondary` | `#6B7280` | Subtitles, hints |
| `--radius-card` | `12px` | Card corner radius |
| `--radius-button` | `8px` | Button corner radius |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Card elevation |
| `--spacing-unit` | `8px` | Base spacing unit |

---

*Generated for School Hub (Minivirson) Mobile App*
*Platform: React Native*
