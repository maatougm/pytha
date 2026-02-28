# 🎨 School Hub UI Design System

> This document summarizes the UI designs created with [Google Stitch](https://stitch.withgoogle.com) for the School Hub (Pythagore) mobile application.

---

## 📁 Design Prompt Files

The following Stitch prompt files contain detailed design specifications:

| File | Description |
|------|-------------|
| [`STITCH_DESIGN_PROMPTS.md`](./STITCH_DESIGN_PROMPTS.md) | Complete collection of Google Stitch prompts for generating UI designs |

---

## 🖼️ Screenshots

### 1. Login Screen
*Mobile authentication with role selection*

![Login Screen - Placeholder](./web_design/screenshots/login-screen.png)

**Key Elements:**
- Hero illustration with students/teachers
- Email/password inputs with validation
- Role selector dropdown (Admin, Teacher, Parent, Student)
- Biometric login option
- "Remember me" toggle

---

### 2. Student Dashboard (Home)
*Main dashboard showing quick stats and recent activity*

![Dashboard - Placeholder](./web_design/screenshots/dashboard-home.png)

**Key Elements:**
- Greeting with user avatar
- Stats cards (unread messages, upcoming assignments, attendance)
- Quick action grid (Messages, Courses, Assignments, Files)
- Recent activity feed
- Bottom navigation bar

---

### 3. Messaging/Chat Screen
*Real-time messaging interface*

![Chat Screen - Placeholder](./web_design/screenshots/chat-screen.png)

**Key Elements:**
- Channel name and member count header
- Message bubbles (user right/purple, others left/white)
- Timestamps grouped by day
- Message input bar with attachments
- Typing indicators

---

### 4. Admin Dashboard (Desktop)
*Analytics and management interface*

![Admin Dashboard - Placeholder](./web_design/screenshots/admin-dashboard.png)

**Key Elements:**
- Left sidebar navigation
- Metric cards (users, courses, messages)
- Charts (activity, messages by channel)
- Recent activity table
- Quick actions panel

---

### 5. User Profile Screen
*Personal settings and information*

![Profile Screen - Placeholder](./web_design/screenshots/profile-screen.png)

**Key Elements:**
- Large circular profile photo
- User name with role badge
- Contact information section
- Settings toggles (notifications, dark mode)
- Logout and delete account options

---

### 6. Courses List Screen
*Course catalog and enrollment*

![Courses Screen - Placeholder](./web_design/screenshots/courses-screen.png)

**Key Elements:**
- Search bar with filters
- Tab switcher (My Courses / All Courses)
- Course cards with progress bars
- Subject color coding
- Floating action button

---

### 7. Assignment Detail Screen
*Assignment submission and grading*

![Assignment Screen - Placeholder](./web_design/screenshots/assignment-detail.png)

**Key Elements:**
- Assignment title with status badge
- Due date countdown
- Description with rich text
- Attachments list
- Submission area with upload
- Grading section

---

## 🎨 Design System Reference

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | `#6B4EE6` | Main brand color, buttons, active states |
| **Primary Dark** | `#151560` | Hover states, emphasis |
| **Primary Light** | `#4a4ab8` | Secondary accents |
| **Accent** | `#f59e0b` / `#FF6B6B` | Highlights, badges, notifications |
| **Success** | `#4CAF50` | Success states, confirmed actions |
| **Warning** | `#FFC107` | Warnings, pending states |
| **Error** | `#FF4444` / `#ef4444` | Errors, destructive actions |
| **Background** | `#F8F9FA` / `#ffffff` | Page backgrounds |
| **Card** | `#FFFFFF` | Card surfaces |
| **Surface Dark** | `#1f2937` | Dark mode surfaces |
| **Text Primary** | `#111827` / `#212529` | Main text |
| **Text Secondary** | `#6b7280` / `#6C757D` | Secondary text |
| **Text Muted** | `#9ca3af` | Placeholder text |
| **Border** | `#e5e7eb` | Borders, dividers |

### Typography Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **H1** | 28px | 700 | App name, major headings |
| **H2** | 24px | 700 | Screen titles |
| **H3** | 20px | 600 | Section headers |
| **H4** | 18px | 600 | Card titles |
| **Body** | 16px | 400 | Main content |
| **Body Small** | 14px | 400 | Secondary content |
| **Caption** | 12px | 400 | Labels, timestamps |
| **Overline** | 12px | 600 | Section labels (uppercase) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | 8px | Small buttons, inputs |
| **md** | 12px | Standard buttons, cards |
| **lg** | 16px | Large cards, modals |
| **xl** | 24px | Hero elements |
| **full** | 9999px | Pills, avatars |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Tight spacing |
| **sm** | 8px | Component internal spacing |
| **md** | 16px | Standard spacing |
| **lg** | 24px | Section spacing |
| **xl** | 32px | Large section gaps |
| **xxl** | 48px | Screen padding |

---

## 🧩 Component Library

### Buttons

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| **Primary** | `#6B4EE6` | White | None |
| **Secondary** | Transparent | `#6B4EE6` | 1px `#6B4EE6` |
| **Ghost** | Transparent | `#6B4EE6` | None |
| **Danger** | `#FF4444` | White | None |
| **Disabled** | `#e5e7eb` | `#9ca3af` | None |

### Inputs

| State | Border | Background |
|-------|--------|------------|
| **Default** | `#e5e7eb` | `#f3f4f6` |
| **Focused** | `#6B4EE6` | `#ffffff` |
| **Error** | `#ef4444` | `#fef2f2` |
| **Disabled** | `#e5e7eb` | `#f3f4f6` |

### Cards

```
Background: #FFFFFF
Border Radius: 16px
Shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
Padding: 16px
```

### Avatars

| Size | Dimension | Usage |
|------|-----------|-------|
| **xs** | 24px | Inline mentions |
| **sm** | 32px | List items |
| **md** | 40px | Standard |
| **lg** | 64px | Profile headers |
| **xl** | 96px | Large profiles |

### Badges

| Type | Background | Text |
|------|------------|------|
| **Primary** | `#6B4EE6` | White |
| **Success** | `#4CAF50` | White |
| **Warning** | `#FFC107` | Black |
| **Error** | `#FF4444` | White |
| **Info** | `#3b82f6` | White |

---

## 📱 Responsive Breakpoints

| Platform | Width | Notes |
|----------|-------|-------|
| **Mobile** | 390px | iPhone 14/15 base |
| **Mobile Large** | 428px | iPhone 14 Pro Max |
| **Tablet** | 768px | iPad Mini |
| **Tablet Large** | 1024px | iPad Pro |
| **Desktop** | 1440px | Standard monitor |

---

## 🚀 How to Generate Designs with Stitch

1. **Visit** [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. **Sign in** with your Google account
3. **Open** [`STITCH_DESIGN_PROMPTS.md`](./STITCH_DESIGN_PROMPTS.md)
4. **Copy** a prompt for the screen you want
5. **Paste** into Stitch's prompt input
6. **Click Generate**
7. **Iterate** using annotations:
   - Click any element to annotate
   - Type changes like "make this larger" or "change to blue"
8. **Export** when satisfied:
   - **HTML/CSS** - For web implementation reference
   - **Figma** - For design system
   - **Code** - Reference for React Native implementation

---

## 🔄 Design Iterations

When iterating designs in Stitch, use these common adjustments:

| Adjustment | Example Annotation |
|------------|-------------------|
| Color change | "Change this button to coral #FF6B6B" |
| Size change | "Make the header 20% larger" |
| Spacing | "Add more space between these cards" |
| Typography | "Make the title bolder" |
| Layout | "Move this to the right side" |
| Add element | "Add a notification badge here" |

---

## 📝 Implementation Notes

- All designs use **Deep Purple (#6B4EE6)** as the primary brand color
- **Coral (#FF6B6B)** is used for accent elements and notifications
- **Rounded corners** (16px) are used throughout for a friendly, modern feel
- **Card-based layouts** with subtle shadows for depth
- **Bottom navigation** on mobile with 5 main tabs
- **Sidebar navigation** on desktop admin views

---

*Generated for School Hub (Pythagore/Minivirson) - School Communication Platform*
