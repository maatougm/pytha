# Missing Screens Analysis - School Hub Mobile App

## Overview
**Backend API Endpoints:** 163 endpoints across 12 modules  
**Existing Mobile Screens:** 43 TSX files  
**Missing Screens Identified:** 15+ critical screens

---

## 🔴 CRITICAL MISSING SCREENS

### 1. MENTIONS MODULE (5 API endpoints - 0 screens)
**Priority:** HIGH - Core messaging feature  
**Missing Screens:**
- [ ] `(app)/mentions/index.tsx` - List all @mentions for current user
- [ ] `(app)/mentions/unread.tsx` - Filter unread mentions only

**API Endpoints:**
- `GET /mentions` - Get current user's mentions
- `GET /mentions/unread-count` - Get unread mention count
- `PATCH /mentions/:id/read` - Mark mention as read
- `PATCH /mentions/read-all` - Mark all mentions as read
- `PATCH /mentions/bulk-read` - Mark specific mentions as read

---

### 2. CHANNEL CREATION & MANAGEMENT (8 API endpoints - 0 screens)
**Priority:** HIGH - Users can't create channels  
**Missing Screens:**
- [ ] `(app)/channel/create.tsx` - Create new channel form
- [ ] `(app)/channel/request.tsx` - Request new conversation (needs approval)
- [ ] `(app)/channel/pending.tsx` - View pending channel requests
- [ ] `(app)/channel/members/[channelId].tsx` - Manage channel members (add/remove)

**API Endpoints:**
- `POST /channels` - Create new channel
- `POST /channels/request` - Request new conversation
- `GET /channels/pending` - Get pending channel requests
- `POST /channels/:id/approve` - Approve channel request
- `POST /channels/:id/reject` - Reject channel request
- `POST /channels/:id/members` - Add member to channel
- `DELETE /channels/:id/members/:userId` - Remove member from channel
- `GET /channels/:id/members` - Get channel members

---

### 3. CLASS SCHEDULES (4 API endpoints - 0 screens)
**Priority:** MEDIUM - Academic calendar feature  
**Missing Screens:**
- [ ] `(app)/class/[classId]/schedules.tsx` - View class schedule/timetable
- [ ] `(app)/teacher/schedules.tsx` - Teacher's teaching schedule
- [ ] `(app)/student/schedules.tsx` - Student's class schedule

**API Endpoints:**
- `POST /classes/:id/schedules` - Add schedules to class
- `GET /classes/:id/schedules` - Get class schedules
- `DELETE /classes/schedules/:scheduleId` - Delete schedule

---

### 4. FILE PERMISSIONS & ADVANCED MANAGEMENT (6 API endpoints - 0 screens)
**Priority:** MEDIUM - Security feature for file sharing  
**Missing Screens:**
- [ ] `(app)/files/[fileId]/permissions.tsx` - Manage file permissions
- [ ] `(app)/files/quota.tsx` - View storage quota usage
- [ ] `(app)/files/shared.tsx` - Files shared with me

**API Endpoints:**
- `POST /files/:id/permissions` - Set file permission
- `GET /files/:id/permissions` - Get file permissions
- `DELETE /files/permissions/:permissionId` - Remove permission
- `GET /files/quota` - Get upload quota info
- `GET /files/stats` - Get storage statistics

---

### 5. ACADEMIC YEAR MANAGEMENT (4 API endpoints - 0 screens)
**Priority:** MEDIUM - Admin feature  
**Missing Screens:**
- [ ] `(app)/admin/academic-years.tsx` - Manage academic years
- [ ] `(app)/admin/grade-promotion.tsx` - Preview/execute grade promotion

**API Endpoints:**
- `GET /admin/academic-years` - Get all academic years
- `POST /admin/academic-years` - Create academic year
- `PATCH /admin/academic-years/:id/set-current` - Set current academic year
- `GET /admin/promotion/preview` - Preview grade promotion
- `POST /admin/promotion/execute` - Execute grade promotion

---

### 6. TEACHER-CLASS ALLOCATIONS (5 API endpoints - 0 screens)
**Priority:** MEDIUM - Admin feature  
**Missing Screens:**
- [ ] `(app)/admin/teacher-allocations.tsx` - Manage teacher-class assignments
- [ ] `(app)/admin/classes/with-teachers.tsx` - View classes with assigned teachers

**API Endpoints:**
- `GET /admin/teacher-class-allocations` - Get teacher-class allocations
- `POST /admin/teacher-class-allocations` - Assign teacher to class
- `DELETE /admin/teacher-class-allocations/:id` - Remove teacher from class
- `GET /admin/teachers/available` - Get teachers with assignments
- `GET /admin/classes/with-teachers` - Get classes with teachers

---

### 7. AUDIT LOGS & CONTENT HISTORY (3 API endpoints - 0 screens)
**Priority:** LOW - Admin transparency feature  
**Missing Screens:**
- [ ] `(app)/admin/audit-logs.tsx` - View system audit logs
- [ ] `(app)/admin/message-history/[messageId].tsx` - View message edit history

**API Endpoints:**
- `GET /admin/audit-logs` - Get system audit logs
- `GET /channels/messages/:messageId/history` - Get message edit history

---

### 8. ADVANCED ANALYTICS (4 API endpoints - 0 screens)
**Priority:** LOW - Enhanced analytics  
**Missing Screens:**
- [ ] `(app)/admin/analytics/export.tsx` - Export analytics data
- [ ] `(app)/admin/analytics/engagement.tsx` - DAU/WAU/MAU metrics

**API Endpoints:**
- `GET /analytics/engagement` - Get engagement metrics (DAU/WAU/MAU)
- `GET /analytics/export` - Export analytics data (CSV/PDF)
- `GET /analytics/users` - Get user activity statistics
- `GET /analytics/files` - Get file storage statistics

---

### 9. BULK OPERATIONS UI (Multiple endpoints - 0 screens)
**Priority:** LOW - Efficiency features  
**Missing Screens:**
- [ ] `(app)/admin/bulk-invite.tsx` - Bulk invite users
- [ ] `(app)/admin/bulk-actions.tsx` - Bulk user actions (activate/deactivate)
- [ ] `(app)/teacher/bulk-attendance.tsx` - Take bulk attendance
- [ ] `(app)/teacher/bulk-grading.tsx` - Grade multiple submissions at once

**API Endpoints:**
- `POST /admin/users/bulk-invite` - Bulk invite users
- `POST /admin/users/bulk-action` - Perform bulk action on users
- `POST /classes/:id/enroll/bulk` - Bulk enroll students
- `POST /classes/:id/attendance/bulk` - Bulk mark attendance
- `POST /assignments/:id/grades/bulk` - Bulk grade submissions

---

### 10. SOFT DELETE RESTORATION (2 API endpoints - 0 screens)
**Priority:** LOW - Data recovery  
**Missing Screens:**
- [ ] `(app)/admin/trash.tsx` - View and restore soft-deleted items

**API Endpoints:**
- `GET /soft-delete` - Get soft-deleted items
- `POST /soft-delete/:type/:id/restore` - Restore soft-deleted item

---

### 11. NOTIFICATION PREFERENCES (2 API endpoints - PARTIAL)
**Priority:** MEDIUM - Settings enhancement  
**Missing Integration:**
- [ ] Add to `(app)/settings/index.tsx` - Notification preferences section

**API Endpoints:**
- `GET /users/me/notifications` - Get notification preferences
- `PUT /users/me/notifications` - Update notification preferences

---

### 12. USER PROFILE ENHANCEMENTS (3 API endpoints - PARTIAL)
**Priority:** LOW - Profile features  
**Missing Screens:**
- [ ] `(app)/user/[userId].tsx` - View other user profiles
- [ ] Add parent-child linking UI to admin

**API Endpoints:**
- `GET /users/:id` - Get user by ID
- `GET /users/:id/children` - Get children for a parent user
- `POST /admin/users/link-parent` - Link parent to student

---

## 📊 SUMMARY TABLE

| Module | API Endpoints | Existing Screens | Missing Screens | Priority |
|--------|--------------|------------------|-----------------|----------|
| Authentication | 6 | 3 | 0 | ✅ Complete |
| Users | 7 | Partial | 2 | 🟡 Low |
| Messaging | 23 | 2 | 2 | 🔴 High |
| Channel Management | 16 | 1 | 4 | 🔴 High |
| Courses & Classes | 19 | 4 | 3 | 🟡 Medium |
| Grading | 13 | 4 | 1 | 🟡 Medium |
| Attendance | 10 | 3 | 1 | 🟡 Medium |
| Files | 16 | 1 | 3 | 🟡 Medium |
| Admin Dashboard | 28 | 7 | 6 | 🟡 Medium |
| Mentions | 5 | 0 | 2 | 🔴 High |
| Moderation | 12 | 1 | 0 | ✅ Complete |
| Analytics | 8 | 1 | 2 | 🟢 Low |
| **TOTAL** | **163** | **43** | **28** | |

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Core Messaging (Sprint 1)
1. Mentions list screen
2. Channel creation screen
3. Channel member management

### Phase 2: Academic Features (Sprint 2)
4. Class schedules view
5. My schedule (teacher/student)

### Phase 3: File & Admin (Sprint 3)
6. File permissions management
7. Academic years management
8. Teacher-class allocations

### Phase 4: Advanced Features (Sprint 4)
9. Audit logs
10. Bulk operations
11. Analytics export

---

## 🧪 TEST COVERAGE GAPS

Current mobile app has **NO automated tests**. Recommended to add:

### Unit Tests
- Component rendering tests
- Hook tests (useAuth, useMessaging, etc.)
- Utility function tests

### Integration Tests
- API service tests
- Navigation flow tests
- Authentication flow tests

### E2E Tests
- Complete user journeys per role
- Critical paths (login → message → logout)
- Offline/online behavior

### Test Files to Create
```
mobile/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── MessageCard.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useMessaging.test.ts
│   ├── screens/
│   │   ├── Login.test.tsx
│   │   └── Chat.test.tsx
│   └── services/
│       └── api.test.ts
├── e2e/
│   ├── auth.flow.test.ts
│   ├── messaging.flow.test.ts
│   └── teacher.flow.test.ts
└── jest.config.js
```
