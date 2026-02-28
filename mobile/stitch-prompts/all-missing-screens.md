# All Missing Screens - Stitch Design Prompts

## Student Role Screens

### 1. My Grades Screen
```
My Grades screen for school management mobile app (Student view)

Key Features:
- Header with "My Grades" title and academic year selector
- GPA summary card showing current GPA prominently
- Grade distribution chart (pie/bar showing A, B, C, D, F counts)
- List of courses with current grade and percentage
- Each course card: Course name, teacher name, current grade (letter + %), trend indicator (up/down)
- Tap to view detailed grade breakdown (assignments, exams, participation)
- Filter options: All Courses, Current Term, Past Terms
- Pull-to-refresh for latest grades

Visual Style:
- Clean, academic aesthetic
- Grade colors: A (green), B (blue), C (yellow), D (orange), F (red)
- Primary: Deep blue (#1e1e8a)
- Card-based layout with 12px border radius
- Progress bars for grade visualization

Platform: React Native mobile (375px)
```

### 2. My Attendance Screen
```
My Attendance screen for school management mobile app (Student view)

Key Features:
- Header with "My Attendance" title
- Summary statistics cards: Present %, Absent days, Late days, Excused days
- Monthly calendar view showing attendance status per day
- Color-coded dots: Green (Present), Red (Absent), Yellow (Late), Blue (Excused)
- List view of attendance history with dates and status
- Attendance trend graph (line chart showing last 30 days)
- Filter by: Month, Term, Course
- Tap on date to see detailed session info

Visual Style:
- Clean calendar interface
- Status colors: Present (green), Absent (red), Late (amber), Excused (blue)
- Primary: Deep blue (#1e1e8a)
- Calendar grid with dot indicators
- Summary cards with large numbers

Platform: React Native mobile (375px)
```

### 3. Course Resources Screen
```
Course Resources screen for school management mobile app (Student view)

Key Features:
- Header with course name and "Resources" title
- List of resource folders by topic/week
- File list with: filename, file type icon, size, upload date
- Download button for each file
- Preview capability for images and PDFs
- Search bar to find specific resources
- Filter by: All, Documents, Videos, Images, Audio
- Offline download indicator

Visual Style:
- File explorer aesthetic
- File type color coding: PDF (red), DOC (blue), IMG (green), Video (purple)
- Primary: Deep blue (#1e1e8a)
- Folder icons in amber/orange
- Clean list with swipe actions

Platform: React Native mobile (375px)
```

---

## Teacher Role Screens

### 4. Attendance Sessions Screen
```
Attendance Sessions screen for school management mobile app (Teacher view)

Key Features:
- Header with "Attendance Sessions" title and date picker
- List of scheduled classes for today
- Each session card: Class name, time, room, student count, status (Not Started, In Progress, Completed)
- Quick action buttons: Start Session, View History, Edit
- Create new session FAB
- Filter by: Today, This Week, All
- Session statistics: Total sessions, Average attendance rate
- Tap to take attendance for a session

Visual Style:
- Professional, organized interface
- Status colors: Not Started (gray), In Progress (blue), Completed (green)
- Primary: Deep blue (#1e1e8a)
- Time-based layout (chronological)
- Card-based with clear action buttons

Platform: React Native mobile (375px)
```

### 5. Create Assignment Screen
```
Create Assignment screen for school management mobile app (Teacher view)

Key Features:
- Header with "Create Assignment" title
- Form fields:
  - Assignment Title (text input)
  - Description (multi-line text)
  - Course/Class selector (dropdown)
  - Due Date & Time picker
  - Points/Max Grade input
  - Assignment Type (Homework, Quiz, Project, Exam, etc.)
  - Attachments section (upload files, images)
  - Instructions for students (rich text)
- Toggle switches: Allow late submissions, Enable peer review
- Save as Draft or Publish buttons
- Preview mode

Visual Style:
- Clean form interface
- Primary: Deep blue (#1e1e8a)
- Input fields with 12px border radius
- Section dividers with headers
- File upload area with dashed border

Platform: React Native mobile (375px)
```

### 6. Assignment Submissions Screen
```
Assignment Submissions screen for school management mobile app (Teacher view)

Key Features:
- Header with assignment name and "Submissions" title
- Summary statistics: Total submissions, Graded, Pending, Late submissions
- Filter tabs: All, Submitted, Graded, Late, Missing
- List of student submissions:
  - Student avatar and name
  - Submission status (On Time, Late, Missing)
  - Submission date/time
  - Grade (if graded) or "Grade" button
  - Attachment indicator
- Tap to view submission details and grade
- Bulk grade option
- Export grades button

Visual Style:
- Clean, organized list view
- Status colors: On Time (green), Late (amber), Missing (red), Graded (blue)
- Primary: Deep blue (#1e1e8a)
- Student avatars in circular format
- Action buttons for quick grading

Platform: React Native mobile (375px)
```

### 7. Class Roster Screen
```
Class Roster screen for school management mobile app (Teacher view)

Key Features:
- Header with class name and "Roster" title
- Class info card: Subject, Grade level, Room, Schedule
- Student count and enrolled count
- List of enrolled students:
  - Student avatar (initials or photo)
  - Full name
  - Student ID
  - Parent contact info
  - Status (Active, Inactive)
- Search bar to find students
- Filter by: All, Active, Inactive
- Add student button
- Export roster option
- Tap to view student profile

Visual Style:
- Clean directory/list view
- Primary: Deep blue (#1e1e8a)
- Student avatars with color-coded initials
- Alphabetical sorting indicator
- Card-based layout with subtle shadows

Platform: React Native mobile (375px)
```

---

## Parent Role Screens

### 8. Child Grades Screen
```
Child Grades screen for school management mobile app (Parent view)

Key Features:
- Header with child's name and "Grades" title
- Child selector (if multiple children) with dropdown
- GPA summary card showing current GPA
- Grade distribution visualization
- List of courses with grades for selected child
- Each course: Course name, teacher, current grade, trend
- Recent grade changes highlighted
- Tap to view detailed grade breakdown
- Compare with class average indicator
- Filter by: Current Term, Past Terms

Visual Style:
- Parent-friendly, reassuring design
- Grade colors: A (green), B (blue), C (yellow), D (orange), F (red)
- Primary: Deep blue (#1e1e8a), Accent: Warm amber
- Clean cards with clear hierarchy
- Progress indicators

Platform: React Native mobile (375px)
```

### 9. Child Attendance Screen
```
Child Attendance screen for school management mobile app (Parent view)

Key Features:
- Header with child's name and "Attendance" title
- Child selector (if multiple children)
- Monthly attendance summary: Present %, Absences, Tardies
- Calendar view showing daily attendance
- Color-coded: Green (Present), Red (Absent), Yellow (Late), Blue (Excused)
- Recent absences list with reasons
- Attendance pattern insights
- Tap on date for details
- Alert for excessive absences

Visual Style:
- Parent-friendly calendar view
- Status colors: Present (green), Absent (red), Late (amber), Excused (blue)
- Primary: Deep blue (#1e1e8a)
- Calendar with clear dot indicators
- Summary cards with key metrics

Platform: React Native mobile (375px)
```

### 10. Child Assignments Screen
```
Child Assignments screen for school management mobile app (Parent view)

Key Features:
- Header with child's name and "Assignments" title
- Child selector (if multiple children)
- Segmented tabs: Upcoming, Overdue, Completed
- List of assignments:
  - Assignment title
  - Course name
  - Due date (with countdown)
  - Status: Not Started, In Progress, Submitted, Graded
  - Grade (if available)
- Filter by: All, This Week, This Month
- Tap to view assignment details
- Reminder to child button

Visual Style:
- Parent-friendly, organized list
- Status colors: Upcoming (blue), Overdue (red), Completed (green)
- Primary: Deep blue (#1e1e8a)
- Due date urgency indicators
- Clean cards with action items

Platform: React Native mobile (375px)
```

---

## Admin Role Screens

### 11. Course Management Screen
```
Course Management screen for school management mobile app (Admin view)

Key Features:
- Header with "Course Management" title
- Total courses count and active courses
- Search bar for finding courses
- Filter by: Department, Grade Level, Status (Active/Inactive)
- List of courses:
  - Course name and code
  - Department
  - Grade levels
  - Number of classes/sections
  - Status toggle (Active/Inactive)
- Add New Course FAB
- Tap to edit course details
- Bulk actions: Activate, Deactivate, Delete

Visual Style:
- Professional admin interface
- Primary: Deep blue (#1e1e8a)
- Status toggle switches
- Clean table-like list view
- Action buttons for quick edits

Platform: React Native mobile (375px)
```

### 12. Class Management Screen
```
Class Management screen for school management mobile app (Admin view)

Key Features:
- Header with "Class Management" title
- Statistics: Total classes, Active classes, Total students
- Search and filter: Course, Teacher, Schedule, Status
- List of classes:
  - Class name and course
  - Teacher name with avatar
  - Schedule (days and time)
  - Room number
  - Enrolled students count / Capacity
  - Status indicator
- Add New Class FAB
- Tap to view class details and roster
- Edit schedule, teacher, or room

Visual Style:
- Admin dashboard aesthetic
- Primary: Deep blue (#1e1e8a)
- Schedule displayed as compact badges
- Status indicators (Active, Inactive, Full)
- Card-based with action buttons

Platform: React Native mobile (375px)
```

### 13. User Invitations Screen
```
User Invitations screen for school management mobile app (Admin view)

Key Features:
- Header with "User Invitations" title
- Invite statistics: Sent, Accepted, Pending, Expired
- Bulk invite section:
  - Role selector (Student, Teacher, Parent, Admin)
  - Email input (multi-email support)
  - Message template
  - Send Invitations button
- List of recent invitations:
  - Recipient email
  - Role
  - Sent date
  - Status (Pending, Accepted, Expired)
  - Resend/Revoke actions
- Filter by: Role, Status
- Import from CSV option

Visual Style:
- Clean admin form interface
- Primary: Deep blue (#1e1e8a)
- Status badges: Pending (amber), Accepted (green), Expired (red)
- Email input with chip/tag style
- Clean list with action buttons

Platform: React Native mobile (375px)
```

### 14. System Settings Screen
```
System Settings screen for school management mobile app (Admin view)

Key Features:
- Header with "System Settings" title
- Settings categories (accordion/sections):
  - General: App name, logo, contact email
  - Academic Year: Current year, terms/semesters
  - Grading: Grade scales, GPA calculation method
  - Attendance: Marking periods, thresholds for alerts
  - Notifications: Default notification preferences
  - Security: Password policy, 2FA settings
  - Integrations: Email, SMS, Storage (S3)
- Each setting with toggle, input, or dropdown
- Save Changes button
- Reset to Defaults option
- Change history log

Visual Style:
- Settings interface like iOS/Android system settings
- Primary: Deep blue (#1e1e8a)
- Section headers with icons
- Toggle switches for boolean settings
- Clean, organized sections

Platform: React Native mobile (375px)
```

---

## Shared Screens

### 15. Notifications Center Screen
```
Notifications Center screen for school management mobile app

Key Features:
- Header with "Notifications" title and "Mark all as read" button
- Segmented control tabs: All, Mentions, Messages, System, Grades
- Notification list with:
  - Sender avatar (circular)
  - Notification title and preview text
  - Timestamp (relative: "2 min ago", "1 hour ago")
  - Unread indicator (blue dot)
  - Swipe actions: Mark read, Dismiss
- Pull-to-refresh
- Empty state: "No notifications yet" with bell icon
- Grouped by date: Today, Yesterday, Earlier
- Priority notifications highlighted with colored left border

Visual Style:
- Clean, email-like notification list
- Unread items have subtle blue left border and light background
- Read items have white/gray background
- Primary: Deep blue (#1e1e8a)
- Mentions highlighted in amber (#f59e0b)
- System notifications in gray

Platform: React Native mobile (375px)
```

### 16. File Manager Screen
```
File Manager screen for school management mobile app

Key Features:
- Folder navigation with breadcrumb trail (Home > Course > Documents)
- File list with thumbnails (PDF icons, image previews, document icons)
- File cards showing: filename, size, upload date, owner, permission badge
- Floating action button (FAB) for upload with options (camera, gallery, browse)
- Swipe actions on files: download, share, delete (if authorized)
- Search bar at top for filtering files
- Filter chips: All, PDFs, Images, Documents, My Files
- Empty state with upload illustration
- Bottom sheet for file details and actions

Visual Style:
- Clean file explorer aesthetic
- Primary color: Deep blue (#1e1e8a)
- File type color coding: PDF (red), DOC (blue), IMG (green), XLS (orange)
- Card-based layout with subtle shadows
- Grid view toggle (list vs grid)

Platform: React Native mobile (375px)
```

### 17. Global Search Screen
```
Global Search screen for school management mobile app

Key Features:
- Prominent search bar at top with microphone icon
- Recent searches shown below (chips with X to remove)
- Filter categories as horizontal chips: All, Courses, Messages, People, Assignments, Files
- Search results grouped by category:
  - Courses: Course thumbnail, name, teacher
  - Messages: Channel name, message preview, sender avatar
  - People: User avatar, name, role badge, online status
  - Assignments: Title, course, due date, status
  - Files: File icon, name, size, course
- "See all results" for each category
- Empty search state with search illustration
- Loading skeleton while searching

Visual Style:
- Modern search interface like iOS Spotlight or Google Search
- Primary accent: Deep blue (#1e1e8a)
- Category chips with active state highlighting
- Result cards with subtle shadows
- Highlight matching text in results

Platform: React Native mobile (375px)
```

---

## Summary

| # | Screen Name | Role | Complexity |
|---|-------------|------|------------|
| 1 | My Grades | Student | Medium |
| 2 | My Attendance | Student | Medium |
| 3 | Course Resources | Student | Low |
| 4 | Attendance Sessions | Teacher | Medium |
| 5 | Create Assignment | Teacher | High |
| 6 | Assignment Submissions | Teacher | Medium |
| 7 | Class Roster | Teacher | Low |
| 8 | Child Grades | Parent | Medium |
| 9 | Child Attendance | Parent | Medium |
| 10 | Child Assignments | Parent | Low |
| 11 | Course Management | Admin | Medium |
| 12 | Class Management | Admin | High |
| 13 | User Invitations | Admin | Medium |
| 14 | System Settings | Admin | High |
| 15 | Notifications Center | Shared | Low |
| 16 | File Manager | Shared | Medium |
| 17 | Global Search | Shared | High |

**Total: 17 screens**

All screens follow the established design system:
- Primary color: Deep blue (#1e1e8a)
- Accent: Amber (#f59e0b)
- Card-based layouts
- 12px border radius
- Lucide icons
- React Native mobile (375px viewport)
