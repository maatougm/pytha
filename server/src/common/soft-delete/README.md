# Soft Delete Module

This module provides comprehensive soft delete functionality across the School Messaging System application.

## Overview

Soft delete allows entities to be marked as deleted without actually removing them from the database. This provides:

- **Data Recovery**: Accidentally deleted items can be restored within the grace period
- **Audit Trail**: Historical data is preserved for compliance
- **Safe Deletion**: Related data integrity is maintained during the grace period
- **Grace Period**: Items are permanently deleted only after 30 days

## Supported Entity Types

- `user` - Deactivates user account, prevents login
- `channel` - Archives channel, hides from normal users
- `message` - Marks as deleted, preserves content for moderation
- `course` - Deactivates course, hides from listings
- `class` - Deactivates class, hides from listings
- `file` - Marks as deleted, preserves file metadata

## API Endpoints

All endpoints require admin authentication.

### Soft Delete an Item
```
DELETE /admin/soft-delete/:type/:id
```
Body (optional):
```json
{
  "reason": "Violation of terms of service"
}
```

### Restore a Soft-Deleted Item
```
POST /admin/restore/:type/:id
```

### Permanently Delete an Item
```
DELETE /admin/permanent-delete/:type/:id
```
Note: Only works after the 30-day grace period or for items already soft-deleted.

### List All Soft-Deleted Items
```
GET /admin/deleted-items
```
Query params:
- `type` (optional): Filter by type (user, channel, message, course, class, file)

### Trigger Cleanup Job Manually
```
POST /admin/cleanup-deleted-items
```
Permanently deletes all items that have been soft-deleted for more than 30 days.

## Database Schema

### Users, Channels, Courses, Classes
These entities have a `deletedAt` field (DateTime, nullable):

```prisma
model User {
  // ... other fields
  deletedAt DateTime? @map("deleted_at")
  // ...
}
```

### Messages and Files
These entities have both `isDeleted` (boolean) and `deletedAt` (DateTime):

```prisma
model Message {
  // ... other fields
  isDeleted Boolean   @default(false) @map("is_deleted")
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by")
  // ...
}
```

## Services Integration

### UsersService
- `findAll()` - Excludes soft-deleted users by default
- `findById()` - Excludes soft-deleted users by default
- `findByEmail()` - Excludes soft-deleted users by default

### CoursesService
- `findAllCourses()` - Excludes soft-deleted courses by default
- `findCourseById()` - Excludes soft-deleted courses by default
- `deleteCourse()` - Now performs soft delete by default
- `findAllClasses()` - Excludes soft-deleted classes by default
- `findClassById()` - Excludes soft-deleted classes by default
- `deleteClass()` - Now performs soft delete by default

### MessagingService
- `getUserChannels()` - Excludes soft-deleted channels
- `getUserChannelsWithUnread()` - Excludes soft-deleted channels
- `getChannel()` - Excludes soft-deleted channels by default
- `deleteMessage()` - Now adds deletedAt and deletedBy tracking

### ChannelManagementService
- All queries filter out soft-deleted channels by default

### AuthService
- Login now checks if user is soft-deleted and prevents authentication
- Refresh token validation also checks soft-delete status

## Cleanup Job

A scheduled job runs weekly (Sundays at 2 AM UTC) to permanently delete items that have been soft-deleted for more than 30 days.

The cleanup job:
1. Queries all soft-deleted items older than 30 days
2. Permanently deletes them from the database
3. Logs the number of items deleted

### Manual Trigger
Admins can trigger the cleanup job manually via the API endpoint.

## SoftDeleteService Methods

### User Operations
- `softDeleteUser(userId, options)` - Soft deletes a user
- `restoreUser(userId, restoredBy)` - Restores a soft-deleted user

### Channel Operations
- `softDeleteChannel(channelId, options)` - Soft deletes a channel
- `restoreChannel(channelId, restoredBy)` - Restores a soft-deleted channel

### Message Operations
- `softDeleteMessage(messageId, options)` - Soft deletes a message
- `restoreMessage(messageId, restoredBy)` - Restores a soft-deleted message

### Course Operations
- `softDeleteCourse(courseId, options)` - Soft deletes a course
- `restoreCourse(courseId, restoredBy)` - Restores a soft-deleted course

### Class Operations
- `softDeleteClass(classId, options)` - Soft deletes a class
- `restoreClass(classId, restoredBy)` - Restores a soft-deleted class

### File Operations
- `softDeleteFile(fileId, options)` - Soft deletes a file
- `restoreFile(fileId, restoredBy)` - Restores a soft-deleted file

### General Operations
- `permanentDelete(type, id, deletedBy)` - Permanently deletes an item (after grace period)
- `getDeletedItems(type?)` - Lists all soft-deleted items
- `cleanupOldDeletedItems()` - Permanently deletes items older than 30 days

## Audit Logging

All soft delete and restore operations are logged to the audit log:
- Action type (user_delete, user_reactivate, etc.)
- Actor ID (who performed the action)
- Target ID (what was affected)
- Metadata (reason, softDelete flag, etc.)

## Best Practices

1. **Always use soft delete first** - Soft delete should be the default for user-initiated deletions
2. **Check deletedAt in queries** - When querying entities, filter by `deletedAt: null` unless explicitly including deleted items
3. **Respect the grace period** - Don't permanently delete items before the 30-day grace period ends
4. **Use admin queries carefully** - Admin queries can include deleted items for moderation purposes
5. **Handle cascade deletions** - When a parent entity is deleted, consider the impact on related entities

## Error Handling

The service provides clear error messages:
- `NotFoundException` - Item not found or already deleted
- `ForbiddenException` - Cannot delete yourself, cannot delete last admin, grace period not expired
- `BadRequestException` - Item must be soft deleted first, item is not deleted

## Testing

When testing soft delete functionality:
1. Test soft delete and restore for each entity type
2. Verify queries exclude soft-deleted items by default
3. Test the grace period enforcement
4. Test the cleanup job functionality
5. Verify audit logs are created correctly
