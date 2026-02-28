# Stitch Screens to React Native Implementation Mapping

## Summary
- **Total Stitch Screens**: 39
- **Missing Screens to Implement**: 17
- **Design System**: Unified Pythagore Design System
  - Primary: Deep Blue (#1E3A8A / #1e1e8a)
  - Accent: Amber/Gold (#F59E0B / #f59f0a)
  - Border Radius: 12px
  - Font: Inter / Lexend

---

## Missing Screens Implementation Guide

### Student Role Screens (3)

| # | Screen | Stitch Reference | File Name | Status |
|---|--------|------------------|-----------|--------|
| 1 | My Grades | Grade Overview View 1 | `grade_overview_view_1_a4be945b.png` | Ready |
| 2 | My Attendance | Attendance Calendar View 1 | `attendance_calendar_view_1_68ead88e.png` | Ready |
| 3 | Course Resources | File Browser View 1 | `file_browser_view_1_eac87a71.png` | Ready |

**Implementation:**
- Route: `(app)/student/grades.tsx`
- Route: `(app)/student/attendance.tsx`
- Route: `(app)/student/resources.tsx`

---

### Teacher Role Screens (4)

| # | Screen | Stitch Reference | File Name | Status |
|---|--------|------------------|-----------|--------|
| 4 | Attendance Sessions | Attendance Calendar View 2 | `attendance_calendar_view_2_0b7e36a2.png` | Ready |
| 5 | Create Assignment | Create New Conversation (adapted) | `create_new_conversation_8efeb072.png` | Ready |
| 6 | Assignment Submissions | Assignment List View 1 | `assignment_list_view_1_c6c475ba.png` | Ready |
| 7 | Class Roster | Messages Channel List (adapted) | `messages_channel_list_b9fa507b.png` | Ready |

**Implementation:**
- Route: `(app)/teacher/attendance-sessions.tsx`
- Route: `(app)/teacher/create-assignment.tsx`
- Route: `(app)/teacher/submissions/[assignmentId].tsx`
- Route: `(app)/teacher/roster/[classId].tsx`

---

### Parent Role Screens (3)

| # | Screen | Stitch Reference | File Name | Status |
|---|--------|------------------|-----------|--------|
| 8 | Child Grades | Grade Overview View 2 | `grade_overview_view_2_3aafd97f.png` | Ready |
| 9 | Child Attendance | Attendance Calendar View 3 | `attendance_calendar_view_3_6bf4551b.png` | Ready |
| 10 | Child Assignments | Assignment List View 2 | `assignment_list_view_2_f2c86cb1.png` | Ready |

**Implementation:**
- Route: `(app)/parent/child-grades.tsx`
- Route: `(app)/parent/child-attendance.tsx`
- Route: `(app)/parent/child-assignments.tsx`

---

### Admin Role Screens (4)

| # | Screen | Stitch Reference | File Name | Status |
|---|--------|------------------|-----------|--------|
| 11 | Course Management | Course Catalog | `course_catalog_ac0a5700.png` | Ready |
| 12 | Class Management | Admin Dashboard View 1 | `admin_dashboard_view_1_cd7f0031.png` | Ready |
| 13 | User Invitations | Create New Conversation (adapted) | `create_new_conversation_8efeb072.png` | Ready |
| 14 | System Settings | Notification Preferences | `notification_preferences_fe3ab9bb.png` | Ready |

**Implementation:**
- Route: `(app)/admin/courses.tsx`
- Route: `(app)/admin/classes.tsx`
- Route: `(app)/admin/invitations.tsx`
- Route: `(app)/admin/system-settings.tsx`

---

### Shared Screens (3)

| # | Screen | Stitch Reference | File Name | Status |
|---|--------|------------------|-----------|--------|
| 15 | Notifications Center | Notifications Center | `notifications_center_95e2e36c.png` | Ready |
| 16 | File Manager | File Manager Screen | `file_manager_screen_e661b267.png` | Ready |
| 17 | Global Search | Global Search Screen | `global_search_screen_aab3c415.png` | Ready |

**Implementation:**
- Route: `(app)/notifications.tsx`
- Route: `(app)/files.tsx`
- Route: `(app)/search.tsx`

---

## All Available Stitch Screens (39 Total)

### Login & Auth
1. `pythagore_login_screen_419464d4.png` - Login Screen Variant 1
2. `pythagore_login_screen_da230fa7.png` - Login Screen Variant 2 (Unified)

### Dashboard
3. `student_home_dashboard_c2891e5f.png` - Student Home Dashboard
4. `student_home_dashboard_e2a91ecb.png` - Student Home Dashboard Variant
5. `admin_dashboard_view_1_cd7f0031.png` - Admin Dashboard Variant 1
6. `admin_dashboard_view_1_14b00290.png` - Admin Dashboard Variant 2
7. `admin_dashboard_view_2_9569e7c4.png` - Admin Dashboard Variant 3
8. `admin_dashboard_view_3_53f48210.png` - Admin Dashboard Variant 4

### Grades
9. `grade_overview_view_1_a4be945b.png` - Grade Overview (GPA Card + List)
10. `grade_overview_view_1_8c89bccb.png` - Grade Overview (Unified)
11. `grade_overview_view_2_3aafd97f.png` - Grade Overview (Bar Chart)
12. `grade_overview_view_3_6eb81d64.png` - Grade Overview (Minimalist)

### Attendance
13. `attendance_calendar_view_1_68ead88e.png` - Attendance Calendar (Dots)
14. `attendance_calendar_view_1_2e5c3bcb.png` - Attendance Calendar (Unified)
15. `attendance_calendar_view_2_0b7e36a2.png` - Attendance Calendar (Teacher)
16. `attendance_calendar_view_3_6bf4551b.png` - Attendance Calendar (Summary)

### Assignments
17. `assignment_list_view_1_c6c475ba.png` - Assignment List (Filter Tabs)
18. `assignment_list_view_1_401d6f66.png` - Assignment List (Cards)
19. `assignment_list_view_2_f2c86cb1.png` - Assignment List (Minimalist)
20. `assignment_list_view_3_8dffe2e0.png` - Assignment List (Compact)

### Files
21. `file_browser_view_1_eac87a71.png` - File Browser (Grid)
22. `file_browser_view_1_450b1cb0.png` - File Browser (Unified Grid)
23. `file_browser_view_2_ec7a91a7.png` - File Browser (List)
24. `file_browser_view_3_4e7e6571.png` - File Browser (Bottom Sheet)
25. `file_manager_screen_e661b267.png` - File Manager (Full)

### Messaging
26. `messages_channel_list_b9fa507b.png` - Messages Channel List
27. `messages_channel_list_43b00915.png` - Messages Channel List (Unified)
28. `chat_conversation_screen_5d20f3a0.png` - Chat Conversation
29. `create_new_conversation_8efeb072.png` - Create New Conversation

### Search & Catalog
30. `global_search_screen_aab3c415.png` - Global Search
31. `course_catalog_ac0a5700.png` - Course Catalog
32. `course_catalog_dbd6011e.png` - Course Catalog Variant

### Calendar
33. `full_calendar_schedule_50515476.png` - Full Calendar Schedule

### Profile & Settings
34. `profile_view_1_25055c87.png` - Profile View Variant 1
35. `profile_view_1_abb7f9d6.png` - Profile View Variant 2
36. `profile_view_2_ed570f9b.png` - Profile View Variant 3
37. `profile_view_3_72b9bcbb.png` - Profile View Variant 4
38. `notification_preferences_fe3ab9bb.png` - Notification Preferences
39. `notifications_center_95e2e36c.png` - Notifications Center

---

## Design Tokens

```typescript
// colors.ts
export const colors = {
  primary: '#1E3A8A',      // Deep Blue
  primaryDark: '#1e1e8a',  // Alternative Deep Blue
  accent: '#F59E0B',       // Amber/Gold
  accentAlt: '#f59f0a',    // Alternative Amber
  
  // Status Colors
  present: '#10B981',      // Green
  absent: '#EF4444',       // Red
  late: '#F59E0B',         // Amber
  excused: '#3B82F6',      // Blue
  
  // Grade Colors
  gradeA: '#10B981',       // Green
  gradeB: '#3B82F6',       // Blue
  gradeC: '#F59E0B',       // Yellow
  gradeD: '#F97316',       // Orange
  gradeF: '#EF4444',       // Red
  
  // Background
  background: '#F8F7F5',   // Warm Off-White
  backgroundDark: '#221C10', // Deep Warm Brown
  card: '#FFFFFF',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

// spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// borderRadius.ts
export const borderRadius = {
  sm: 8,
  md: 12,  // Primary
  lg: 16,
  xl: 24,
  full: 9999,
};
```

---

## Next Steps

1. ✅ Download all Stitch designs (DONE)
2. 🔄 Create React Native components for all 17 missing screens
3. 🔄 Implement navigation routes
4. 🔄 Add API integration
5. 🔄 Test all screens
