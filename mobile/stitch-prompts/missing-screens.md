# Missing Screens - Stitch UI Design Prompts

## 1. File Manager Screen

```
File manager screen for school management mobile app

Key Features:
- Folder navigation with breadcrumb trail (Home > Course Name > Documents)
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

## 2. Notifications Center Screen

```
Notifications center screen for school messaging app

Key Features:
- Segmented control tabs: All, Mentions, Messages, System, Grades
- Notification list with:
  - Avatar of sender (circular)
  - Notification title and preview text
  - Timestamp (relative: "2 min ago", "1 hour ago")
  - Unread indicator (blue dot)
  - Action buttons: Mark read, Dismiss
- Pull-to-refresh
- "Mark all as read" button in header
- Empty state: "No notifications yet" with bell icon
- Grouped by date: Today, Yesterday, Earlier
- Priority notifications highlighted with colored left border

Visual Style:
- Clean, email-like notification list
- Unread items have subtle blue left border and light blue background
- Read items have white/gray background
- Primary: Deep blue (#1e1e8a)
- Mentions highlighted in amber (#f59e0b)
- System notifications in gray

Platform: React Native mobile (375px)
```

## 3. Global Search Screen

```
Global search screen for school hub mobile app

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

## 4. Full Calendar/Schedule Screen

```
Full calendar screen for school schedule management

Key Features:
- Calendar view toggle: Month, Week, Day, Agenda (list)
- Month view: Traditional calendar grid with event dots
- Week view: Time-based columns (Monday-Sunday)
- Day view: Detailed timeline with hours
- Agenda view: List of upcoming events
- Events displayed with color coding by course
- Event details on tap: Title, time, location, course, teacher
- Add event FAB (for teachers/admins)
- Filter by: My Classes, Assignments Due, Exams, All
- Today button to jump to current date
- Swipe left/right to navigate dates

Visual Style:
- Clean calendar interface like Google Calendar or Apple Calendar
- Course events color-coded (assign each course a color)
- Today highlighted with circle
- Weekend days slightly muted background
- Deep blue (#1e1e8a) for primary actions
- Current time indicator line (red)

Platform: React Native mobile (375px)
```

## 5. Create Channel/New Message Screen

```
New conversation/channel creation screen

Key Features:
- Two tabs at top: "Direct Message" and "Group/Channel"
- Direct Message tab:
  - Search users by name or email
  - User list with avatar, name, role badge, online status
  - Multi-select capability for group DMs
  - "Start Chat" button
- Group/Channel tab:
  - Channel name input
  - Channel type selector: Classroom, Study Group, Parent-Teacher, Admin
  - Add members: Search and select users
  - Member chips showing selected users with X to remove
  - Channel description input
  - Privacy toggle: Public (anyone can join) vs Private (invite only)
  - "Create Channel" button

Visual Style:
- Clean, form-focused interface
- Primary: Deep blue (#1e1e8a)
- User avatars in circular format
- Selected members shown as removable chips
- Role badges color-coded (Admin=purple, Teacher=teal, Parent=coral, Student=blue)
- Form validation with inline errors

Platform: React Native mobile (375px)
```

## 6. Notification Preferences Screen

```
Notification preferences settings screen

Key Features:
- Scrollable list of notification categories:
  - Messages (toggle for direct messages, group mentions, channel broadcasts)
  - Assignments (new assignment posted, due soon reminder, graded)
  - Grades (when grade posted, when parent views child's grade)
  - Attendance (marked absent, marked late)
  - System (announcements, maintenance, new features)
- Each category has 3 toggle options:
  - Push notifications (mobile)
  - Email notifications
  - In-app notifications
- Master toggle at top: "Pause all notifications" with duration selector
- Quiet hours settings: Start time, end time, days
- "Save Changes" button at bottom
- Reset to defaults option

Visual Style:
- Settings interface like iOS Settings or Android Settings
- Clean toggle switches (iOS style)
- Category headers with icons
- Primary: Deep blue (#1e1e8a) for active toggles
- Section dividers
- Help text explaining each notification type

Platform: React Native mobile (375px)
```

---

## Summary

| Screen | Key Purpose | Estimated Complexity |
|--------|-------------|---------------------|
| File Manager | Browse, upload, download files | Medium |
| Notifications | Central hub for all alerts | Low |
| Global Search | Find anything in the app | High |
| Calendar | Full schedule management | High |
| Create Channel | Start new conversations | Medium |
| Notification Prefs | Customize alert settings | Low |

All screens follow the established design system:
- Primary color: Deep blue (#1e1e8a)
- Accent: Amber (#f59e0b)
- Card-based layouts
- 12px border radius
- Lucide icons
- React Native mobile (375px viewport)
