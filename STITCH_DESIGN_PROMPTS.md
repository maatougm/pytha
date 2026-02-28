# 🎨 Google Stitch Design Prompts - School Hub (Pythagore)

> Copy-paste these prompts into [Google Stitch](https://stitch.withgoogle.com) to generate modern UI designs

---

## 1. 🏫 Login Screen (Mobile)

```
Mobile login screen for "Pythagore" - a school communication app

Key Features:
- Hero illustration of students/teachers collaborating (abstract, friendly)
- Email input field with validation icon
- Password field with show/hide toggle
- "Remember me" checkbox
- Primary login button with subtle gradient
- "Forgot password?" text link
- "Create account" secondary CTA at bottom
- School logo placeholder at top

Visual Style:
- Clean, modern, trustworthy
- Primary: Deep purple (#6B4EE6)
- Secondary: Soft coral (#FF6B6B)
- Background: White with subtle geometric pattern
- Typography: Rounded sans-serif, friendly but professional
- Rounded corners (16px) on all cards and buttons

Platform: iOS mobile (390px width)
Interactions: 
- Button press states with scale animation
- Input focus states with purple border glow
- Smooth transitions between states
```

---

## 2. 🏠 Student Dashboard (Home Screen)

```
Mobile dashboard for "Pythagore" school app - student home screen

Key Features:
- Top greeting: "Good morning, [Name]!" with avatar
- Stats row: 3 cards showing unread messages, upcoming assignments, attendance streak
- Quick actions grid (2x2): Messages, Courses, Assignments, Files
- Recent activity feed with:
  - New message notifications with sender avatars
  - Assignment due reminders
  - Class announcements
- Bottom navigation bar (5 items): Home, Chat, Courses, Calendar, Profile

Visual Style:
- Modern card-based layout
- Primary: Deep purple (#6B4EE6)
- Accent: Coral (#FF6B6B) for notifications
- Cards: White with subtle shadow (elevation 2)
- Background: Light gray (#F8F9FA)
- Smooth rounded corners throughout

Platform: iOS mobile (390px width)
Special: Include unread badge indicators, profile photo placeholder, scrollable content
```

---

## 3. 💬 Chat/Messaging Screen

```
Mobile messaging screen for school communication app

Key Features:
- Top bar: Back button, channel name "Class 10A - Math", member count, info icon
- Message list with:
  - Sender avatars (circular, 40px)
  - Bubble messages (user right/purple, others left/white)
  - Timestamps grouped by day
  - Message status indicators (sent/delivered/read)
  - Reply-to preview for threaded conversations
- Message input bar at bottom:
  - Attachment button (paperclip)
  - Text input field
  - Emoji button
  - Send button (active state when text entered)

Visual Style:
- Chat bubbles with subtle shadows
- User messages: Purple gradient (#6B4EE6 to #9B7BF7)
- Others: White with gray border
- Background: Light gray (#F5F5F5)
- Input bar: White with top border shadow
- Smooth message animations

Platform: iOS mobile (390px width)
States: Empty state, typing indicator, attachment preview
```

---

## 4. 📊 Admin Dashboard (Desktop)

```
Desktop admin dashboard for "Pythagore" school management system

Layout:
- Left sidebar (240px): Navigation menu with icons
  - Dashboard (active)
  - User Management
  - Courses & Classes
  - Messaging
  - Assignments
  - Attendance
  - Reports
  - Settings
- Top header: Search bar, notifications bell with badge, admin profile
- Main content area with 4 metric cards:
  - Total Users (with growth indicator)
  - Active Courses
  - Messages Today
  - Pending Approvals
- Charts section:
  - Line chart: User activity (last 30 days)
  - Bar chart: Messages by channel type
- Recent activity table:
  - User registrations
  - System alerts
  - Message reports
- Quick actions panel on right

Visual Style:
- Professional, data-focused
- Primary: Deep purple (#6B4EE6)
- Charts: Purple, coral, teal, yellow data colors
- Sidebar: Dark navy (#1A1F36)
- Cards: White with subtle borders
- Background: Light gray (#F8F9FA)

Platform: Desktop web (1440px width)
Interactions: Hover states on table rows, chart tooltips, dropdown menus
```

---

## 5. 👤 User Profile Screen

```
Mobile profile screen for school communication app

Key Features:
- Large circular profile photo (120px) with edit overlay
- User name and role badge (Student/Teacher/Parent/Admin)
- Contact info section:
  - Email
  - Phone (optional)
  - Class/Grade (for students)
- Settings list:
  - Notifications toggle
  - Dark mode toggle
  - Language selector
  - Privacy settings
  - Help & Support
- Danger zone at bottom:
  - Logout button (outline style)
  - Delete account (red text)

Visual Style:
- Clean, minimal, personal
- Profile photo with subtle shadow ring
- Section headers in muted gray
- Settings items with chevron arrows
- Toggle switches in purple
- Danger actions in red (#FF4444)
- Background: White

Platform: iOS mobile (390px width)
Special: Include placeholder avatar, scrollable content, sticky header on scroll
```

---

## 6. 📚 Courses List Screen

```
Mobile courses list screen for school app

Key Features:
- Search bar at top with filter icon
- Tab switcher: "My Courses" | "All Courses"
- Course cards list with:
  - Subject icon (colored circle with icon)
  - Course name
  - Teacher name with small avatar
  - Progress bar showing completion %
  - Next class time
- Floating action button to browse catalog
- Pull-to-refresh indicator

Visual Style:
- Card-based list with horizontal scroll for categories
- Subject colors: Math (blue), Science (green), History (orange), etc.
- Progress bars with gradient fills
- Cards with left border accent (subject color)
- Background: Light gray (#F8F9FA)

Platform: iOS mobile (390px width)
Interactions: Card tap expands details, long-press for quick actions
```

---

## 7. 📝 Assignment Detail Screen

```
Mobile assignment detail view for school app

Key Features:
- Header with assignment title and status badge (Pending/Submitted/Graded)
- Due date with countdown indicator
- Assignment description with rich text
- Attachments list (PDF, images)
- Submission section:
  - Upload area with drag-drop style
  - Text submission field
  - Submit button
- Grading section (if graded):
  - Grade/score display
  - Teacher feedback
  - Submission timestamp
- Comments thread at bottom

Visual Style:
- Clean, focused, academic
- Status badges: Yellow (pending), Green (submitted), Blue (graded)
- Attachment cards with file icons
- Upload zone with dashed border
- Comments in threaded conversation style
- Background: White

Platform: iOS mobile (390px width)
States: Uploading progress, submission confirmation, error states
```

---

## 🚀 How to Use in Google Stitch

1. **Visit** [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. **Sign in** with Google account
3. **Copy** one prompt above
4. **Paste** into the prompt input
5. **Click Generate**
6. **Iterate** using annotations:
   - Click any element to annotate
   - Type changes like "make this larger" or "change to blue"
7. **Export** when satisfied:
   - **HTML/CSS** - For web implementation
   - **Figma** - For design system
   - **Code** - Reference for implementation

---

## 🎨 Design System Reference

| Element | Value |
|---------|-------|
| **Primary** | #6B4EE6 (Deep Purple) |
| **Secondary** | #FF6B6B (Coral) |
| **Success** | #4CAF50 (Green) |
| **Warning** | #FFC107 (Amber) |
| **Error** | #FF4444 (Red) |
| **Background** | #F8F9FA (Light Gray) |
| **Card** | #FFFFFF (White) |
| **Text Primary** | #212529 (Dark) |
| **Text Secondary** | #6C757D (Gray) |
| **Border Radius** | 16px (cards), 12px (buttons), 8px (inputs) |

---

## 📱 Responsive Breakpoints

| Platform | Width | Notes |
|----------|-------|-------|
| Mobile | 390px | iPhone 14/15 |
| Tablet | 768px | iPad Mini |
| Desktop | 1440px | Standard monitor |

---

*Generated for School Hub (Pythagore) - School Communication Platform*
