# 🎨 Google Stitch Design Prompts - Profile, Admin & Attendance Screens

> Copy-paste these prompts into [Google Stitch](https://stitch.withgoogle.com) to generate modern UI designs for School Hub (Pythagore)

---

## 1. 👤 User Profile Screen (Mobile)

### Parent/Student Variant:

```
Mobile profile screen for "Pythagore" school communication app - Parent view

Key Features:
- Large circular profile photo (120px diameter) centered at top with camera edit icon overlay (bottom-right, 32px white circle with purple icon)
- User info section:
  - Full name "Sarah Johnson" in bold 20px text
  - Role badge "Parent" with purple background (#6B4EE6) and white text
  - Email address "sarah.j@email.com" with envelope icon
  - Bio text area (2-3 lines) in muted gray
- Settings sections with section headers in uppercase, muted gray:
  - "Preferences" section:
    - Notifications toggle with bell icon (on by default)
    - Dark mode toggle with moon icon
    - Language selector row with globe icon showing "English" with chevron
  - "Account" section:
    - Privacy settings row with shield icon and chevron
    - Help & Support row with question icon and chevron
- "Children" section for linked student accounts:
  - Section header "My Children" with "+ Add" button
  - Child card with:
    - Small circular avatar (48px) with initials "MJ"
    - Name "Michael Johnson" and grade "Grade 10"
    - Class info "10A - Math, Science, History"
    - Right chevron for navigation
  - Second child card below (compact list style)
- Bottom danger zone:
  - "Logout" button full-width, outline style with red text (#FF4444) and red border
  - "Delete Account" text link in red below logout

Visual Style:
- Clean, minimal, personal interface
- Primary: Deep purple (#6B4EE6) for accents and toggles
- Background: Light gray (#F8F9FA)
- Cards: White with subtle shadow (elevation 1)
- Text: Dark (#212529) primary, gray (#6C757D) secondary
- Toggle switches: Purple when ON, gray when OFF
- Role badge: Purple background (#6B4EE6), white text, rounded corners (16px)
- Section headers: Uppercase, 12px, muted gray (#6C757D), letter-spacing 1px
- Border radius: 16px (cards), 24px (buttons), 100% (avatars)

Platform: iOS mobile (390px width)
Special: Include placeholder avatar with initials, scrollable content, sticky header on scroll with back button, safe area padding for iPhone notch
Interactions: Toggle animations, card tap feedback (ripple), profile photo tap opens image picker modal
```

### Teacher/Admin Variant:

```
Mobile profile screen for "Pythagore" school communication app - Teacher view

Key Features:
- Large circular profile photo (120px) with edit overlay
- User info section:
  - Full name "Mr. David Chen" in bold 20px text
  - Role badge "Teacher" with teal background (#00897B) and white text
  - Email address "d.chen@school.edu"
  - Department "Mathematics Department" tag
  - Bio text area for professional summary
- Settings sections:
  - "Preferences" section:
    - Notifications toggle with bell icon
    - Dark mode toggle
    - Language selector
  - "Teaching" section:
    - My Classes row with book icon showing "5 Classes"
    - Office Hours row with clock icon showing "Mon-Fri 2-4pm"
    - Grading Settings row with checkmark icon
  - "Account" section:
    - Privacy settings
    - Help & Support
- "Classes I Teach" section:
  - Section header with "View All" link
  - Horizontal scroll of class cards:
    - Class "10A Math" with student count "28 students"
    - Class "11B Calculus" with student count "24 students"
    - Compact card format with colored subject icons
- Bottom: Logout button (outline style), Delete Account link

Visual Style:
- Professional, organized, academic interface
- Primary: Deep purple (#6B4EE6) for accents
- Role badge: Teal (#00897B) for teacher distinction
- Class cards: Light blue (#E3F2FD) background with blue icons
- Background: Light gray (#F8F9FA)
- Cards: White with subtle shadow
- Section headers: Uppercase, 12px, muted gray, letter-spacing 1px

Platform: iOS mobile (390px width)
Special: Include subject-specific color coding for class cards, professional avatar placeholder, scrollable with sticky section headers
```

---

## 2. 📊 Admin Dashboard Screen (Mobile)

```
Mobile admin dashboard for "Pythagore" school management system

Key Features:
- Top header bar:
  - Screen title "Admin Dashboard" bold left-aligned
  - Notification bell icon with red badge showing "3"
  - Admin avatar (40px circle) with online status dot (green)
- Stats overview cards (2x2 grid):
  - Card 1: "Total Users" with icon (users group), large number "1,247", green up-arrow with "+12%" growth indicator, purple accent bar at bottom
  - Card 2: "Active Now" with icon (active indicator), number "156", blue pulse dot, "Online now" subtitle
  - Card 3: "Courses" with icon (book), number "42", coral (#FF6B6B) accent bar
  - Card 4: "Messages Today" with icon (chat bubble), number "892", purple accent bar
- Quick actions section:
  - Section header "Quick Actions" with "See All" link
  - Horizontal scroll of action buttons (icon + label):
    - "Add User" with person-plus icon (purple background)
    - "Create Course" with book-plus icon (teal background)
    - "Broadcast" with megaphone icon (coral background)
    - "Reports" with chart icon (blue background)
    - "Settings" with gear icon (gray background)
  - Each button: 80px width, rounded square (16px), icon on top, label below
- Recent activity feed:
  - Section header "Recent Activity" with filter icon
  - Activity list with items:
    - New user registered: "John Smith (Parent)" with timestamp "2 min ago", user avatar, purple left border
    - Course created: "Advanced Physics 101" by "Admin" with "15 min ago"
    - Message reported: "Flagged message in Class 9B" with warning icon, yellow accent
    - System alert: "Backup completed successfully" with checkmark, green accent
  - Each item: Avatar/icon left, content middle, timestamp right, subtle divider line
- System health indicators:
  - Section header "System Status"
  - Horizontal status cards:
    - "Database" with green checkmark "Operational"
    - "API" with green checkmark "99.9% Uptime"
    - "Storage" with yellow warning icon "85% Full"
  - Progress bar for storage showing 85% filled in yellow
- Admin navigation shortcuts (bottom section):
  - Section header "Management"
  - List items with icons and chevrons:
    - User Management (people icon)
    - Analytics & Reports (chart icon)
    - Content Moderation (shield icon)
    - System Settings (gear icon)
    - Audit Logs (clipboard icon)

Visual Style:
- Professional admin interface, data visualization focus
- Primary: Deep blue (#1A237E) for headers and primary actions
- Accent colors: Purple (#6B4EE6), Coral (#FF6B6B), Teal (#00897B), Blue (#2196F3)
- Status colors: Green (#4CAF50) operational, Yellow (#FFC107) warning, Red (#FF4444) critical
- Background: Light gray (#F8F9FA)
- Cards: White with subtle shadow (elevation 2), 16px border radius
- Stats numbers: Bold 24-32px, dark text
- Growth indicators: Green for positive, red for negative
- Grid spacing: 12px gaps between stat cards
- Activity items: Left border accent (4px) in purple for important, gray for normal

Platform: iOS mobile (390px width)
Special: Pull-to-refresh functionality, scrollable content with sticky date headers, real-time status indicators with pulse animations, tap on stat card expands to detail view
Interactions: Card tap reveals detailed view, action buttons have haptic feedback, activity items swipe for quick actions, status indicators update in real-time
States: Loading skeletons for stats, empty state for activity feed, error state for system status
```

---

## 3. ✅ Attendance Screen (Mobile)

### Teacher View:

```
Mobile attendance taking screen for "Pythagore" school app - Teacher view

Key Features:
- Top navigation bar:
  - Back arrow left
  - Screen title "Take Attendance" centered
  - Calendar icon button right for date picker
- Class selector section:
  - Dropdown button showing "Class 10A - Mathematics" with chevron
  - Small text below showing "28 students enrolled"
  - Teacher name "Mr. David Chen" and subject icon
- Date picker row:
  - Left/right arrow navigation
  - Center date display "Monday, Feb 24, 2025" with calendar icon
  - "Today" quick-select button
- Session info bar:
  - Period selector: "Period 1" | "Period 2" | "Period 3" (horizontal segmented control)
  - Current time display
- Student attendance list (scrollable):
  - Section header showing "All Students (28)" with search icon
  - Student list items with:
    - Circular avatar (48px) with student photo or initials
    - Student name "Emma Wilson" bold
    - Roll number "#10045" in muted text
    - Status toggle buttons (horizontal segmented):
      - "Present" - Green (#4CAF50) when selected, white with green border when not
      - "Absent" - Red (#FF4444) when selected, white with red border when not
      - "Late" - Yellow/Orange (#FF9800) when selected, white with orange border when not
      - "Excused" - Blue (#2196F3) when selected, white with blue border when not
    - Default state: All set to "Present"
  - Visual indicators:
    - Green checkmark for Present
    - Red X for Absent
    - Yellow clock for Late
    - Blue document for Excused
  - Student rows alternate subtle background tint
  - Swipe left to mark all remaining as present shortcut
- Statistics summary bar (sticky at bottom above button):
  - Present: "24" in green
  - Absent: "2" in red
  - Late: "1" in yellow
  - Excused: "1" in blue
  - Total: "28"
- Submit button section:
  - Full-width "Submit Attendance" button, purple (#6B4EE6) background, white text, 48px height
  - "Save as Draft" secondary text link below
  - Last saved timestamp "Auto-saved 2 min ago" in muted text

Visual Style:
- Professional, efficient, classroom-focused interface
- Status colors: Present Green (#4CAF50), Absent Red (#FF4444), Late Yellow (#FF9800), Excused Blue (#2196F3)
- Primary: Deep purple (#6B4EE6) for primary actions
- Background: Light gray (#F8F9FA)
- Student cards: White background, subtle shadow, 12px border radius
- Status buttons: Rounded pill shape (20px radius), compact size (32px height)
- Selected state: Filled with color, white text
- Unselected state: White fill, colored border, colored text
- Avatar: Circular with colored ring matching status (green for present by default)
- Section dividers: Light gray lines or increased spacing

Platform: iOS mobile (390px width)
Special: Search/filter bar at top of list, alphabetical index on right side (A-Z), batch select mode (checkboxes), offline mode indicator, auto-save functionality
Interactions: Tap status button toggles selection, long-press on student opens note dialog, swipe gestures for quick actions, pull-to-refresh class list, haptic feedback on status change
States: Empty class state, all students marked confirmation, network error state, submission success modal
```

### Student/Parent View:

```
Mobile attendance history screen for "Pythagore" school app - Student/Parent view

Key Features:
- Top header:
  - Back button left
  - Title "Attendance History" centered
  - Filter icon right
- Student selector (for parents with multiple children):
  - Horizontal scroll of child cards:
    - Active child: "Michael Johnson" with purple border, Grade 10
    - Other children shown as compact avatars
- Overview statistics cards (horizontal scroll):
  - "This Month" card: Large "95%" attendance rate, green indicator, "19/20 days present"
  - "This Term" card: "92%" attendance rate, yellow indicator, "46/50 days present"
  - "Streak" card: "12 days" current streak, fire emoji/icon, "Keep it up!"
- Calendar view (main content):
  - Month navigation: Left/Right arrows with "February 2025" centered
  - Weekday headers: S M T W T F S (abbreviated)
  - Calendar grid with:
    - Day numbers in circles
    - Color-coded status indicators below each date:
      - Green dot: Present
      - Red dot: Absent
      - Yellow dot: Late
      - Blue dot: Excused
      - Gray dash: Weekend/Holiday
      - No marker: Future date
    - Current date highlighted with purple border
    - Selected date with purple background
  - Legend below calendar: "Present" (green), "Absent" (red), "Late" (yellow), "Excused" (blue)
- Selected day detail panel (expandable bottom sheet):
  - Date header: "Monday, February 24, 2025"
  - Day status: Large status badge "Present" with green background
  - Class schedule for that day:
    - Period 1: Mathematics - Present (green checkmark)
    - Period 2: English - Present (green checkmark)
    - Period 3: Science - Late (yellow clock, arrived 10:15am)
    - Period 4: History - Present (green checkmark)
  - Notes section (if any): "Arrived late due to doctor's appointment"
- Monthly statistics section:
  - Bar chart showing daily attendance for current month:
    - Green bars for present days
    - Red bars for absent days
    - Yellow bars for late days
  - Y-axis: Day of month
  - X-axis: Status count
- Recent absences/lates list:
  - Section header "Recent Absences"
  - List of recent missed days with:
    - Date "Feb 15, 2025"
    - Status "Absent" with red badge
    - Reason "Sick leave" if provided
    - Days ago "11 days ago"
- Attendance policy info card:
  - Collapsible card with school attendance policy
  - "Minimum 90% attendance required for exam eligibility"
  - Link to full policy

Visual Style:
- Clean, informative, encouraging interface
- Status colors: Present Green (#4CAF50), Absent Red (#FF4444), Late Yellow (#FF9800), Excused Blue (#2196F3)
- Primary: Deep purple (#6B4EE6) for primary actions and highlights
- Background: Light gray (#F8F9FA)
- Calendar: White background, clean grid lines
- Stats cards: White with left border accent (green for good, yellow for caution, red for concern)
- Status badges: Rounded pills with appropriate background colors
- Progress indicators: Circular progress showing percentage
- Bar chart: Status-colored bars with subtle grid lines
- Child selector: Horizontal scroll with active state highlighted

Platform: iOS mobile (390px width)
Special: Swipe between months on calendar, tap date to see details, pull-to-refresh, export attendance report button, set attendance goal feature
Interactions: Calendar date tap expands details, swipe left/right changes month, tap stats card for detailed breakdown, long-press on date to add note (parent view)
States: Empty state for new students, loading skeleton for calendar, error state for failed data load, celebration animation for perfect attendance month
```

---

## 🎨 Design System Reference

| Element | Value |
|---------|-------|
| **Primary** | #6B4EE6 (Deep Purple) |
| **Secondary** | #FF6B6B (Coral) |
| **Deep Blue** | #1A237E (Admin Primary) |
| **Present** | #4CAF50 (Green) |
| **Absent** | #FF4444 (Red) |
| **Late** | #FF9800 (Orange/Yellow) |
| **Excused** | #2196F3 (Blue) |
| **Success** | #4CAF50 (Green) |
| **Warning** | #FFC107 (Amber) |
| **Error** | #FF4444 (Red) |
| **Background** | #F8F9FA (Light Gray) |
| **Card** | #FFFFFF (White) |
| **Text Primary** | #212529 (Dark) |
| **Text Secondary** | #6C757D (Gray) |
| **Border Radius** | 16px (cards), 24px (buttons), 8px (inputs), 100% (avatars) |

### Role Color Coding:
- **Admin**: Deep Purple (#6B4EE6)
- **Teacher**: Teal (#00897B)
- **Parent**: Coral (#FF6B6B)
- **Student**: Blue (#2196F3)

### Attendance Status Colors:
- **Present**: Green (#4CAF50) with checkmark icon
- **Absent**: Red (#FF4444) with X icon
- **Late**: Orange (#FF9800) with clock icon
- **Excused**: Blue (#2196F3) with document icon

---

## 📱 Platform Specifications

| Platform | Width | Notes |
|----------|-------|-------|
| iOS Mobile | 390px | iPhone 14/15 Pro |
| Safe Area | 44px (top) / 34px (bottom) | iPhone notch handling |
| Touch Target | 44px minimum | Accessibility compliance |
| Typography | San Francisco (iOS system) | -apple-system font |

---

## 🚀 How to Use in Google Stitch

1. **Visit** [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. **Sign in** with Google account
3. **Copy** the desired prompt from above
4. **Paste** into the prompt input
5. **Click Generate**
6. **Iterate** using annotations:
   - Click any element to annotate
   - Type changes like "make this button larger" or "change to blue"
   - Request variants with "Generate 3 variants of this stats card"
7. **Export** when satisfied:
   - **HTML/CSS** - For web reference
   - **Figma** - For design system integration
   - **Code** - Reference for React Native implementation

### Iteration Tips:
- Start with the base screen, then add role-specific elements
- Use "Make this more compact" for denser admin interfaces
- Use "Increase contrast" for better accessibility
- Request "Dark mode variant" for theme support

---

## 📝 Implementation Notes for React Native

### Profile Screen:
- Use circular `Image` with `View` overlay for profile photos
- Implement `Pressable` rows for settings items
- Use collapsible sections for Children section
- Add animated scroll header behaviour

### Admin Dashboard:
- Use `FlatList` with 2-column layout for stat cards
- Implement `FlatList` for activity feed
- Use `Animated` API for card-to-detail transitions
- Add pull-to-refresh via `RefreshControl`

### Attendance Screen:
- Use `react-native-calendars` or custom calendar component
- Implement segmented controls for status selection
- Use `Animated` for status color transitions
- Add swipeable rows via `react-native-gesture-handler`

---

*Generated for School Hub (Pythagore) - School Communication Platform*
*Prompts optimized for Google Stitch AI UI generation*
