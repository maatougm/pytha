# School Hub Backend API Documentation

## Overview
This document provides a comprehensive reference of all available API endpoints, WebSocket events, DTOs, and role-based permissions for the School Hub backend.

**Base URL:** `/api`  
**WebSocket Namespace:** `/messaging` (messaging), `/admin` (admin dashboard)  
**Authentication:** JWT Bearer Token  
**API Version:** 1.0.0

---

## Table of Contents
1. [Authentication Module](#1-authentication-module)
2. [Users Module](#2-users-module)
3. [Messaging Module](#3-messaging-module)
4. [Courses Module](#4-courses-module)
5. [Classes Module](#5-classes-module)
6. [Grading Module](#6-grading-module)
7. [Attendance Module](#7-attendance-module)
8. [Files Module](#8-files-module)
9. [Admin Module](#9-admin-module)
10. [Analytics Module](#10-analytics-module)
11. [Moderation Module](#11-moderation-module)
12. [Mentions Module](#12-mentions-module)
13. [Soft Delete Module](#13-soft-delete-module)
14. [Health & Metrics](#14-health--metrics)
15. [WebSocket Events](#15-websocket-events)
16. [Role-Based Permissions Summary](#16-role-based-permissions-summary)

---

## 1. Authentication Module

**Controller:** `AuthController`  
**Base Route:** `/api/auth`

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user (non-admin roles only) |
| POST | `/api/auth/admin/create-user` | ✅ Admin | Admin: create a user with any role |
| POST | `/api/auth/login` | ❌ | Login with email and password |
| POST | `/api/auth/refresh` | ❌ | Refresh access token (uses httpOnly cookie) |
| POST | `/api/auth/logout` | ✅ | Logout and invalidate tokens |
| GET | `/api/auth/profile` | ✅ | Get current user profile |

### Key DTOs

```typescript
// RegisterDto
{
  email: string;        // Valid email, max 255 chars
  password: string;     // Min 8 chars, requires uppercase, lowercase, number, special char
  firstName: string;    // Max 100 chars
  lastName: string;     // Max 100 chars
  phone?: string;       // Optional, max 20 chars
  role: 'admin' | 'teacher' | 'parent' | 'student';
}

// LoginDto
{
  email: string;
  password: string;
}

// RefreshDto
{
  refreshToken: string;
}
```

### Response Format (Login/Register)
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  accessToken: string;  // 15-minute expiration
  // refreshToken is set as httpOnly cookie (7-day expiration)
}
```

---

## 2. Users Module

**Controller:** `UsersController`  
**Base Route:** `/api/users`

### Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/users` | ✅ | admin, teacher | Get all users with pagination |
| GET | `/api/users/role/:roleName` | ✅ | admin, teacher | Get users by role |
| GET | `/api/users/:id` | ✅ | Any | Get user by ID (self, admin, teacher, or related users) |
| GET | `/api/users/:id/children` | ✅ | Any | Get children for a parent user |
| GET | `/api/users/me/notifications` | ✅ | Any | Get current user notification preferences |
| PUT | `/api/users/me/notifications` | ✅ | Any | Update notification preferences |

### Query Parameters

**List Users:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)

---

## 3. Messaging Module

**Controllers:** `MessagingController`, `ChannelManagementController`  
**Base Route:** `/api/channels`

### Channel Management Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/channels` | ✅ | Any | Create a new channel |
| POST | `/api/channels/request` | ✅ | Any | Request a new conversation (requires admin approval) |
| POST | `/api/channels/podcast` | ✅ | admin | Create a podcast channel |
| POST | `/api/channels/classroom` | ✅ | Any | Create a classroom channel |
| GET | `/api/channels` | ✅ | Any | Get user's channels |
| GET | `/api/channels/my` | ✅ | Any | Get user's channels with unread counts |
| GET | `/api/channels/:id` | ✅ | Any | Get channel by ID |
| GET | `/api/channels/:id/members` | ✅ | Any | Get channel members |
| POST | `/api/channels/:id/members` | ✅ | Any | Add member to channel |
| DELETE | `/api/channels/:id/members/:userId` | ✅ | Any | Remove member from channel |

### Message Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/channels/:id/messages` | ✅ | Get messages (cursor-based pagination) |
| POST | `/api/channels/:id/messages` | ✅ | Send message to channel |
| PATCH | `/api/channels/messages/:messageId` | ✅ | Edit message |
| DELETE | `/api/channels/messages/:messageId` | ✅ | Delete message (soft delete) |

### Read Receipts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/channels/:id/read` | ✅ | Mark channel as read |
| POST | `/api/channels/messages/:messageId/read` | ✅ | Mark specific message as read |
| POST | `/api/channels/:id/messages/read` | ✅ | Mark multiple messages as read |
| GET | `/api/channels/messages/:messageId/read-receipts` | ✅ | Get read receipts for a message |
| GET | `/api/channels/:id/read-status` | ✅ | Get read status for channel messages |
| GET | `/api/channels/:id/messages/with-receipts` | ✅ | Get messages with read receipts included |

### Reactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/channels/messages/:messageId/reactions` | ✅ | Add reaction to message |
| DELETE | `/api/channels/messages/:messageId/reactions/:reaction` | ✅ | Remove reaction |
| GET | `/api/channels/messages/:messageId/reactions` | ✅ | Get reactions for message |

### Channel Admin Features

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/channels/pending` | ✅ | admin | Get pending channel requests |
| POST | `/api/channels/:id/approve` | ✅ | admin | Approve channel request |
| POST | `/api/channels/:id/reject` | ✅ | admin | Reject channel request |
| POST | `/api/channels/:id/mute` | ✅ | Any (channel owner/moderator) | Mute a user |
| POST | `/api/channels/:id/mute-all` | ✅ | Any (channel owner/moderator) | Mute all students |
| POST | `/api/channels/:id/unmute/:userId` | ✅ | Any (channel owner/moderator) | Unmute a user |
| POST | `/api/channels/:id/unmute-all` | ✅ | Any (channel owner/moderator) | Unmute all students |
| GET | `/api/channels/:id/mutes` | ✅ | Any | Get list of muted users |
| GET | `/api/channels/admin/all` | ✅ | admin | Get all conversations with filters |
| GET | `/api/channels/admin/:id/details` | ✅ | admin | Get detailed conversation view |

### Search & Reports

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/channels/:id/search` | ✅ | Any | Search messages (full-text) |
| POST | `/api/channels/:id/report` | ✅ | Any | Report a channel |
| GET | `/api/channels/:id/full-history` | ✅ | admin | Get full channel history |
| GET | `/api/channels/admin/reports` | ✅ | admin | Get all reports |
| PATCH | `/api/channels/admin/reports/:reportId` | ✅ | admin | Update report status |

### Channel Types
- `podcast` - Admin broadcast channel
- `classroom` - Class-specific channel
- `class_broadcast` - Teacher-to-class announcements
- `direct_message` - 1:1 conversation
- `teacher_parent` - Teacher-parent communication
- `teacher_student` - Teacher-student communication
- `admin_broadcast` - Admin announcements
- `group` - Multi-user group chat

### Key DTOs

```typescript
// CreateChannelDto
{
  type: 'podcast' | 'classroom' | 'class_broadcast' | 'direct_message' | 
        'teacher_parent' | 'teacher_student' | 'admin_broadcast' | 'group';
  name: string;           // Max 200 chars
  description?: string;   // Max 1000 chars
  memberIds?: string[];   // Max 500 members
  classId?: string;
  maxMembers?: number;    // 2-1000
}

// SendMessageDto
{
  content: string;        // Max 4000 chars
  replyTo?: string;       // Message ID to reply to
}

// AddReactionDto
{
  reaction: string;       // Emoji or reaction identifier
}
```

---

## 4. Courses Module

**Controller:** `CoursesController`  
**Base Route:** `/api/courses`

### Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/courses` | ✅ | admin, teacher | Create a new course |
| GET | `/api/courses` | ✅ | Any | Get all courses |
| GET | `/api/courses/:id` | ✅ | Any | Get course by ID |
| PUT | `/api/courses/:id` | ✅ | admin | Update course |
| DELETE | `/api/courses/:id` | ✅ | admin | Delete course |

### Query Parameters
- `department` (string) - Filter by department
- `active` (boolean) - Filter by active status
- `search` (string) - Search in name/description
- `page` (number)
- `limit` (number)

### Key DTOs

```typescript
// CreateCourseDto
{
  code: string;           // Max 20 chars
  name: string;           // Max 200 chars
  description?: string;   // Max 5000 chars
  credits?: number;       // 0-20
  department?: string;    // Max 100 chars
}

// UpdateCourseDto
{
  name?: string;
  description?: string;
  credits?: number;
  department?: string;
  isActive?: boolean;
}
```

---

## 5. Classes Module

**Controller:** `ClassesController`  
**Base Route:** `/api/classes`

### Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/classes` | ✅ | admin, teacher | Create a new class |
| GET | `/api/classes` | ✅ | Any | Get all classes |
| GET | `/api/classes/my` | ✅ | Any | Get current user's classes |
| GET | `/api/classes/admin/summary` | ✅ | admin | Get admin classes summary |
| GET | `/api/classes/:id` | ✅ | Any | Get class by ID |
| PUT | `/api/classes/:id` | ✅ | admin, teacher | Update class |
| DELETE | `/api/classes/:id` | ✅ | admin | Delete class |

### Enrollment

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/classes/:id/enroll` | ✅ | admin, teacher | Enroll a student |
| POST | `/api/classes/:id/enroll/bulk` | ✅ | admin, teacher | Bulk enroll students |
| DELETE | `/api/classes/:id/students/:studentId` | ✅ | admin, teacher | Drop a student |
| GET | `/api/classes/:id/roster` | ✅ | Any | Get class roster |

### Schedules

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/classes/:id/schedules` | ✅ | admin, teacher | Add schedules to class |
| GET | `/api/classes/:id/schedules` | ✅ | Any | Get class schedules |
| DELETE | `/api/classes/schedules/:scheduleId` | ✅ | admin, teacher | Delete schedule |

### Query Parameters
- `term` (string)
- `teacherId` (string)
- `courseId` (string)
- `studentId` (string)
- `page` (number)
- `limit` (number)

### Key DTOs

```typescript
// CreateClassDto
{
  courseId: string;       // UUID
  teacherId: string;      // UUID
  term: string;           // Max 50 chars
  section?: string;       // Max 20 chars
  room?: string;          // Max 50 chars
  maxStudents?: number;   // 1-1000
}

// CreateScheduleDto
{
  dayOfWeek: number;      // 0-6 (Sunday-Saturday)
  startTime: string;      // "09:00"
  endTime: string;        // "10:30"
}
```

---

## 6. Grading Module

**Controller:** `GradingController`  
**Routes:** `/api/classes/:classId/assignments`, `/api/assignments`, `/api/submissions`

### Assignments

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/classes/:classId/assignments` | ✅ | admin, teacher | Create assignment |
| GET | `/api/classes/:classId/assignments` | ✅ | Any | Get class assignments |
| GET | `/api/assignments/:id` | ✅ | Any | Get assignment by ID |
| PUT | `/api/assignments/:id` | ✅ | admin, teacher | Update assignment |
| DELETE | `/api/assignments/:id` | ✅ | admin, teacher | Delete assignment |

### Submissions

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/assignments/:id/submit` | ✅ | student | Submit assignment |
| GET | `/api/assignments/:id/submissions` | ✅ | admin, teacher | Get all submissions |
| GET | `/api/assignments/:assignmentId/submissions/my` | ✅ | Any | Get my submission |

### Grading

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/submissions/:id/grade` | ✅ | admin, teacher | Grade a submission |
| POST | `/api/assignments/:id/grades/bulk` | ✅ | admin, teacher | Bulk grade submissions |

### Gradebook

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/classes/:classId/gradebook` | ✅ | admin, teacher | Get class gradebook |
| GET | `/api/students/:studentId/grades` | ✅ | Any | Get student grades |
| GET | `/api/grades/my` | ✅ | Any | Get my grades |

### Key DTOs

```typescript
// CreateAssignmentDto
{
  title: string;          // Max 200 chars
  description?: string;   // Max 5000 chars
  dueDate: string;        // ISO date string
  maxPoints?: number;     // 1-10000
  type?: 'homework' | 'quiz' | 'exam' | 'project';
}

// CreateSubmissionDto
{
  content?: string;       // Max 10000 chars
  fileIds?: string[];     // Max 10 files
}

// GradeSubmissionDto
{
  score: number;          // 0-10000
  feedback?: string;      // Max 2000 chars
  letterGrade?: string;   // Max 5 chars (A+, A, B, etc.)
}
```

---

## 7. Attendance Module

**Controller:** `AttendanceController`

### Sessions

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/classes/:classId/attendance` | ✅ | admin, teacher | Create attendance session |
| GET | `/api/classes/:classId/attendance` | ✅ | Any | Get class attendance sessions |
| GET | `/api/attendance/sessions/:sessionId` | ✅ | Any | Get session details |

### Marking Attendance

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| PUT | `/api/attendance/:sessionId/students/:studentId` | ✅ | admin, teacher | Mark individual attendance |
| POST | `/api/classes/:classId/attendance/bulk` | ✅ | admin, teacher | Bulk mark attendance |

### Reports

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/students/:studentId/attendance` | ✅ | Any | Get student attendance history |
| GET | `/api/attendance/my` | ✅ | Any | Get my attendance |
| GET | `/api/classes/:classId/attendance/weekly` | ✅ | admin, teacher | Get weekly attendance |
| GET | `/api/classes/:classId/attendance/summary` | ✅ | admin, teacher | Get class attendance summary |
| GET | `/api/attendance/reports` | ✅ | admin | Get attendance reports |

### Key DTOs

```typescript
// CreateAttendanceSessionDto
{
  date: string;           // ISO date
  period?: number;        // 1-3
  notes?: string;         // Max 1000 chars
}

// MarkAttendanceDto
{
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;         // Max 500 chars
}

// BulkAttendanceDto
{
  date: string;
  period?: number;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;                      // Max 200 records
  sessionNotes?: string;
}
```

---

## 8. Files Module

**Controller:** `FilesController`  
**Base Route:** `/api/files`

### Upload & Management

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/files/upload` | ✅ | Any | Upload a file (multipart/form-data) |
| GET | `/api/files/quota` | ✅ | Any | Get upload quota information |
| GET | `/api/files/allowed-types` | ✅ | Any | Get allowed file types |
| GET | `/api/files` | ✅ | Any | List files (scoped to user) |
| GET | `/api/files/my` | ✅ | Any | Get current user's files |
| GET | `/api/files/stats` | ✅ | Any | Get storage statistics |
| GET | `/api/files/:id` | ✅ | Any | Get file metadata |
| DELETE | `/api/files/:id` | ✅ | Any | Delete a file |

### Download & Preview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/files/:id/download` | ✅ | Download file (stream) |
| GET | `/api/files/:id/preview` | ✅ | Get file preview (images, rate limited) |
| GET | `/api/files/:id/thumbnail` | ✅ | Get file thumbnail |

### Permissions

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/files/:id/permissions` | ✅ | admin, teacher | Set file permission |
| GET | `/api/files/:id/permissions` | ✅ | Any | Get file permissions (owner/admin only) |
| DELETE | `/api/files/permissions/:permissionId` | ✅ | admin, teacher | Remove permission |

### Admin Operations

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/files/:id/validate` | ✅ | admin | Validate file integrity |
| POST | `/api/files/cleanup` | ✅ | admin | Clean up deleted files |

### File Categories & Limits

| Category | Max Size | MIME Types |
|----------|----------|------------|
| Image | 5MB | jpeg, png, gif, webp, svg, bmp, tiff |
| Document | 10MB | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, md, json, xml |
| Audio | 50MB | mp3, wav, ogg, aac, m4a, flac |
| Video | 100MB | mp4, mpeg, mov, avi, mkv, webm, flv |
| Archive | 50MB | zip, 7z |

### Rate Limits
- 5 uploads per minute per user
- 10 preview requests per minute per user

---

## 9. Admin Module

**Controller:** `AdminController`  
**Base Route:** `/api/admin`  
**Required Role:** `admin`

### Dashboard Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard/metrics` | Get system-wide metrics |
| GET | `/api/admin/dashboard/timeline` | Get activity timeline data |
| GET | `/api/admin/dashboard/realtime` | Get real-time statistics |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users with filtering/pagination |
| PUT | `/api/admin/users/:id/status` | Update user status (activate/suspend/archive/delete) |
| POST | `/api/admin/users/bulk-action` | Bulk action on multiple users |
| POST | `/api/admin/users/invite` | Invite a new user |
| POST | `/api/admin/users/create` | Manually create a user |
| POST | `/api/admin/users/link-parent` | Link parent to student |
| POST | `/api/admin/users/bulk-invite` | Bulk invite users |
| PUT | `/api/admin/users/:id` | Update user details |
| DELETE | `/api/admin/users/:id` | Delete user permanently |
| POST | `/api/admin/users/:id/reset-password` | Reset user password |

### Content Moderation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/moderation/queue` | Get content moderation queue |

### System Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/settings` | Get current system settings |
| PUT | `/api/admin/settings` | Update system settings |

### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-logs` | Get system audit logs |

### Teacher-Class Allocation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/teacher-class-allocations` | Get all allocations |
| POST | `/api/admin/teacher-class-allocations` | Assign teacher to class |
| DELETE | `/api/admin/teacher-class-allocations/:id` | Remove teacher from class |
| GET | `/api/admin/teachers/available` | Get teachers with assignments |
| GET | `/api/admin/classes/with-teachers` | Get classes with teachers |

### Class Composition

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/classes/composition` | Get class composition |
| GET | `/api/admin/students/unassigned` | Get unassigned students |
| POST | `/api/admin/classes/:classId/enroll` | Enroll student in class |
| DELETE | `/api/admin/classes/:classId/unenroll/:studentId` | Remove student from class |

### Academic Year

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/academic-years` | Get all academic years |
| POST | `/api/admin/academic-years` | Create academic year |
| PATCH | `/api/admin/academic-years/:id/set-current` | Set current academic year |

### Grade Promotion

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/promotion/preview` | Preview grade promotion |
| POST | `/api/admin/promotion/execute` | Execute grade promotion |

### Background Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/tasks/cleanup` | Trigger manual cleanup |

---

## 10. Analytics Module

**Controller:** `AnalyticsController`  
**Base Route:** `/api/analytics`

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/analytics/dashboard` | ✅ | admin | Get dashboard statistics |
| GET | `/api/analytics/users` | ✅ | Any | Get user activity stats |
| GET | `/api/analytics/messages` | ✅ | Any | Get message statistics |
| GET | `/api/analytics/channels` | ✅ | Any | Get channel statistics |
| GET | `/api/analytics/files` | ✅ | Any | Get file storage stats |
| GET | `/api/analytics/engagement` | ✅ | Any | Get engagement metrics (DAU, WAU, MAU) |
| GET | `/api/analytics/export` | ✅ | admin | Export analytics (CSV/PDF) |
| GET | `/api/analytics/health` | ✅ | Any | Check analytics service health |

### Query Parameters
- `range` (enum): `today`, `week`, `month`, `quarter`, `year`
- `type` (export): `users`, `messages`, `grades`
- `format` (export): `csv`, `pdf`

---

## 11. Moderation Module

**Controller:** `ModerationController`  
**Base Route:** `/api/moderation`  
**Required Role:** `admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moderation/reports` | Get channel reports |
| GET | `/api/moderation/reports/stats` | Get report statistics |
| PATCH | `/api/moderation/reports/:id` | Update report status |
| PATCH | `/api/moderation/channels/:channelId/mute/:userId` | Mute user in channel |
| PATCH | `/api/moderation/channels/:channelId/unmute/:userId` | Unmute user |
| PATCH | `/api/moderation/channels/:channelId/ban/:userId` | Ban user from channel |
| PATCH | `/api/moderation/channels/:channelId/unban/:userId` | Unban user |
| DELETE | `/api/moderation/messages/:messageId` | Delete message (admin) |
| PATCH | `/api/moderation/channels/:channelId/archive` | Archive channel |
| PATCH | `/api/moderation/channels/:channelId/unarchive` | Unarchive channel |
| GET | `/api/moderation/channels/:channelId/members` | Get channel members |
| GET | `/api/moderation/audit-log` | Get moderation audit log |

---

## 12. Mentions Module

**Controller:** `MentionsController`  
**Base Route:** `/api/mentions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/mentions` | ✅ | Get current user's mentions |
| GET | `/api/mentions/unread-count` | ✅ | Get unread mention count |
| PATCH | `/api/mentions/:id/read` | ✅ | Mark mention as read |
| PATCH | `/api/mentions/read-all` | ✅ | Mark all mentions as read |
| PATCH | `/api/mentions/bulk-read` | ✅ | Mark specific mentions as read |

### Query Parameters
- `unreadOnly` (boolean)
- `page` (number)
- `limit` (number)

---

## 13. Soft Delete Module

**Controller:** `SoftDeleteController`  
**Base Route:** `/api/admin`  
**Required Role:** `admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/admin/soft-delete/:type/:id` | Soft delete an item |
| POST | `/api/admin/restore/:type/:id` | Restore soft-deleted item |
| DELETE | `/api/admin/permanent-delete/:type/:id` | Permanently delete item |
| GET | `/api/admin/deleted-items` | List all soft-deleted items |
| POST | `/api/admin/cleanup-deleted-items` | Trigger cleanup |

### Soft Delete Types
- `user`
- `channel`
- `message`
- `course`
- `class`
- `file`

**Note:** Items are soft-deleted for 30 days before permanent deletion (configurable).

---

## 14. Health & Metrics

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | Full health check (DB, Redis, memory) |
| GET | `/api/health/ready` | ❌ | Readiness probe |
| GET | `/api/health/live` | ❌ | Liveness probe |

### Metrics (Prometheus)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/metrics` | ❌ | - | Prometheus metrics endpoint |
| GET | `/api/metrics/dashboard` | ✅ | admin | Human-readable metrics dashboard |
| GET | `/api/metrics/active-users` | ✅ | admin | Active users count |
| GET | `/api/metrics/websocket-connections` | ✅ | admin | WebSocket connection count |

---

## 15. WebSocket Events

### Messaging Gateway (`/messaging` namespace)

#### Client → Server Events

| Event | Payload | Rate Limit | Description |
|-------|---------|------------|-------------|
| `message:send` | `{ channelId, content, replyTo?, contentType? }` | 30/min | Send a message |
| `message:edit` | `{ messageId, content }` | 20/min | Edit a message |
| `message:delete` | `{ messageId, softDelete? }` | 10/min | Delete a message |
| `message:read` | `{ messageId, channelId }` | - | Mark message as read |
| `message:read_bulk` | `{ channelId, messageIds[] }` | - | Mark multiple messages as read |
| `typing:start` | `{ channelId }` | 60/min | Start typing indicator |
| `typing:stop` | `{ channelId }` | 60/min | Stop typing indicator |
| `typing:get` | `{ channelId }` | - | Get currently typing users |
| `channel:join` | `{ channelId }` | 10/min | Join a channel room |
| `reaction:add` | `{ messageId, reaction }` | 30/min | Add reaction to message |
| `reaction:remove` | `{ messageId, reaction }` | 20/min | Remove reaction |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Message object | New message received |
| `message:updated` | Message object | Message was edited |
| `message:deleted` | `{ messageId, deletedAt }` | Message was deleted |
| `message:read_receipt` | `{ messageId, userId, readAt }` | Read receipt notification |
| `message:reaction_added` | `{ messageId, userId, reaction }` | Reaction added |
| `message:reaction_removed` | `{ messageId, userId, reaction }` | Reaction removed |
| `typing:update` | `{ channelId, users[] }` | Typing indicator update |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |

### Admin Gateway (`/admin` namespace)

**Required Role:** `admin`

#### Client → Server Events

| Event | Payload | Rate Limit | Description |
|-------|---------|------------|-------------|
| `dashboard:subscribe` | - | 10/min | Subscribe to dashboard updates |
| `dashboard:refresh` | - | 30/min | Request dashboard refresh |
| `users:subscribe` | - | 10/min | Subscribe to user updates |
| `moderation:subscribe` | - | 10/min | Subscribe to moderation updates |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `dashboard:metrics` | SystemMetrics | System metrics update |
| `dashboard:realtime` | RealtimeStats | Real-time statistics |
| `user:new` | User object | New user registered |
| `user:status-change` | `{ userId, status, actorId }` | User status changed |
| `message:new` | Message object | New message (for moderation) |
| `content:flagged` | Content object | Content was flagged |
| `system:alert` | Alert object | System alert broadcast |

---

## 16. Role-Based Permissions Summary

### Available Roles
- `admin` - Full system access
- `teacher` - Class management, grading, attendance
- `parent` - View child's progress, communicate with teachers
- `student` - Submit assignments, view grades, attend classes

### Permission Matrix

| Feature | Admin | Teacher | Parent | Student |
|---------|-------|---------|--------|---------|
| **User Management** | | | | |
| Create/Delete Users | ✅ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ❌ | ❌ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| **Courses** | | | | |
| Create/Update/Delete | ✅ | ❌ | ❌ | ❌ |
| View Courses | ✅ | ✅ | ✅ | ✅ |
| **Classes** | | | | |
| Create/Delete | ✅ | ❌ | ❌ | ❌ |
| Update | ✅ | ✅ | ❌ | ❌ |
| Enroll/Drop Students | ✅ | ✅ | ❌ | ❌ |
| View Class Roster | ✅ | ✅ | ✅ | ✅ |
| **Assignments** | | | | |
| Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |
| Submit | ❌ | ❌ | ❌ | ✅ |
| View | ✅ | ✅ | ✅ | ✅ |
| **Grading** | | | | |
| Grade Submissions | ✅ | ✅ | ❌ | ❌ |
| View All Grades | ✅ | ✅ | ❌ | ❌ |
| View Own Grades | ✅ | ✅ | ✅ | ✅ |
| **Attendance** | | | | |
| Create Sessions | ✅ | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| **Messaging** | | | | |
| Create Channels | ✅ | ✅ | ✅ | ✅ |
| Join Channels | ✅ | ✅ | ✅ | ✅ |
| Send Messages | ✅ | ✅ | ✅ | ✅ |
| Moderate Channels | ✅ | ✅ (own) | ❌ | ❌ |
| **Files** | | | | |
| Upload | ✅ | ✅ | ✅ | ✅ |
| Set Permissions | ✅ | ✅ | ❌ | ❌ |
| **Admin Dashboard** | | | | |
| View Metrics | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| **Moderation** | | | | |
| Mute/Ban Users | ✅ | ✅ (channel) | ❌ | ❌ |
| Delete Messages | ✅ | ✅ (own) | ❌ | ❌ |
| View Reports | ✅ | ❌ | ❌ | ❌ |

---

## 17. Common Response Patterns

### Success Response
```typescript
{
  // Varies by endpoint
}
```

### Error Response
```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

### Paginated Response
```typescript
{
  data: Array<T>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

---

## 18. Rate Limits

### HTTP API
- Global: 100 requests per minute per IP
- File Upload: 5 uploads per minute per user
- File Preview: 10 requests per minute per user

### WebSocket
- `message:send`: 30/min
- `message:edit`: 20/min
- `message:delete`: 10/min
- `typing:start/stop`: 60/min each
- `channel:join`: 10/min
- `reaction:add`: 30/min
- `reaction:remove`: 20/min

---

*This documentation was generated from source code analysis of the School Hub backend API.*
