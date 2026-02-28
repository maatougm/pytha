# Push Notifications Setup Guide

This document explains how the School Hub mobile app implements push notifications using Expo Notifications.

## Overview

The push notification system consists of:

1. **Frontend (Mobile App)** - Request permissions, get push token, receive notifications
2. **Backend (NestJS)** - Store tokens, send push notifications via Expo Push API
3. **Expo Push Service** - Delivers notifications to iOS/Android devices

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Mobile App  │────────▶│   Backend    │────────▶│ Expo Push    │
│              │         │   (NestJS)   │         │   Service    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        ▼
       │                        │                 ┌──────────────┐
       │                        │                 │  Apple APNS  │
       │                        │                 │  FCM (Google)│
       │                        │                 └──────────────┘
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│  Push Token  │────────▶│ Store Token  │
│  Permission  │         │ Send Notif   │
└──────────────┘         └──────────────┘
```

## Frontend Implementation

### Files Created/Modified

1. **`src/services/notifications.service.ts`** (Enhanced)
   - Push token management
   - Permission handling
   - Local notification scheduling
   - Deep linking
   - Badge count management

2. **`src/hooks/useNotifications.ts`** (New)
   - `usePushToken()` - Get and manage push token
   - `useNotificationListener()` - Listen for incoming notifications
   - `useLocalNotification()` - Schedule local notifications
   - `useNotificationCenter()` - Manage notification state
   - `useNotificationBadge()` - Manage app badge count

3. **`src/providers/NotificationProvider.tsx`** (New)
   - Global notification handler
   - In-app notification banners
   - Navigation handling
   - Push token registration with backend

4. **`app/(app)/notifications.tsx`** (Updated)
   - Real notification center
   - Group by date (Today, Yesterday, Earlier)
   - Mark as read/unread
   - Delete notifications
   - Filter by type

5. **`app.json`** (Updated)
   - iOS notification configuration
   - Android notification configuration
   - Expo notifications plugin

6. **`app/_layout.tsx`** (Updated)
   - Added NotificationProvider wrapper

### Usage Examples

#### Request Permission and Get Push Token

```typescript
import { usePushToken } from '@/src/hooks/useNotifications';

function MyComponent() {
  const { token, isLoading, error, refreshToken } = usePushToken();

  const handleEnableNotifications = async () => {
    const newToken = await refreshToken();
    if (newToken) {
      console.log('Push token:', newToken);
    }
  };

  return (
    <Button onPress={handleEnableNotifications}>
      Enable Notifications
    </Button>
  );
}
```

#### Schedule Local Notification

```typescript
import { useLocalNotification } from '@/src/hooks/useNotifications';
import { NotificationCategory } from '@/src/services/notifications.service';

function MyComponent() {
  const { schedule } = useLocalNotification();

  const handleScheduleReminder = async () => {
    await schedule(
      'Assignment Due Soon',
      'Your Math homework is due tomorrow',
      {
        type: NotificationCategory.ASSIGNMENT,
        assignmentId: '123',
      },
      { seconds: 3600 } // 1 hour from now
    );
  };

  return (
    <Button onPress={handleScheduleReminder}>
      Set Reminder
    </Button>
  );
}
```

#### Use Notification Center

```typescript
import { useNotificationCenter } from '@/src/hooks/useNotifications';

function NotificationsScreen() {
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterByType,
  } = useNotificationCenter();

  // Render notifications...
}
```

#### Use Global Notification Context

```typescript
import { useNotification } from '@/src/providers/NotificationProvider';

function MyComponent() {
  const {
    pushToken,
    isPushEnabled,
    hasPermission,
    requestPermission,
    navigateToNotification,
  } = useNotification();

  // Access global notification state...
}
```

## Backend Integration

### Required Backend Endpoints

#### 1. Register Push Token

```typescript
POST /api/notifications/register-token
Body: {
  token: string;        // Expo push token
  platform: string;     // 'ios' | 'android' | 'web'
}
```

#### 2. Unregister Push Token

```typescript
POST /api/notifications/unregister-token
Body: {}
```

#### 3. Send Push Notification (Server-side)

The backend should use the Expo Push API to send notifications:

```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(pushTokens: string[], message: {
  title: string;
  body: string;
  data?: object;
}) {
  const messages = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      badge: 1,
      priority: 'high',
    }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  return tickets;
}
```

### Database Schema (Prisma)

```prisma
model PushToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform  String   // 'ios' | 'android' | 'web'
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

## Notification Types

The app handles these notification types:

| Type | Category | Icon | Navigation |
|------|----------|------|------------|
| New Message | `message` | MessageCircle | `/(app)/chat/[channelId]` |
| Assignment Due | `assignment` | FileText | `/(app)/assignment/[assignmentId]` |
| Grade Posted | `grade` | Award | `/(app)/assignment/[assignmentId]` |
| Mention | `mention` | AtSign | `/(app)/chat/[channelId]` |
| Attendance | `attendance` | Calendar | `/(tabs)/index` |
| System Announcement | `announcement` | Megaphone | `/(tabs)/messages` |

## Configuration

### app.json

The app.json includes configuration for:

- **iOS**: `UIBackgroundModes` for remote notifications, permission descriptions
- **Android**: Notification icon, color, permissions
- **Expo**: Notification plugin configuration

### Environment Variables

```env
EXPO_PUBLIC_API_URL=https://api.schoolhub.com/api
EXPO_PUBLIC_WS_URL=wss://api.schoolhub.com
```

## Testing Push Notifications

### Using Expo Push Tool

1. Get your push token from the app:
   ```typescript
   const token = await getPushToken();
   console.log(token); // ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   ```

2. Use Expo Push Notification Tool:
   https://expo.dev/notifications

3. Or send via cURL:
   ```bash
   curl -H "Content-Type: application/json" \
        -X POST "https://exp.host/--/api/v2/push/send" \
        -d '{
          "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
          "title": "Test Notification",
          "body": "This is a test!",
          "data": { "type": "message", "channelId": "123" }
        }'
   ```

### Local Notifications (Testing)

```typescript
import { scheduleLocalNotification } from '@/src/services/notifications.service';

// Schedule immediate notification
await scheduleLocalNotification(
  'Test',
  'This is a local notification',
  { type: NotificationCategory.ANNOUNCEMENT }
);
```

## Platform-Specific Notes

### iOS

- Requires physical device for testing (simulator doesn't support push)
- Provisioning profile must include Push Notifications capability
- User must grant permission before receiving notifications

### Android

- Works on emulator and physical device
- Notification channels are created automatically
- Foreground notifications require configuration

### Web

- Push notifications not supported on web
- Graceful degradation: hooks return null/false for web
- Local notifications not available

## Troubleshooting

### Common Issues

1. **No push token on simulator**
   - Push notifications require a physical device
   - Use local notifications for simulator testing

2. **Notifications not received in foreground**
   - Check `configureNotificationHandler()` is called
   - Verify `shouldShowAlert: true` in handler

3. **Deep link not working**
   - Verify Expo Router path format
   - Check notification data has correct IDs

4. **Badge count not updating**
   - iOS: Check "Badges" permission granted
   - Android: Badge count may not be supported on all launchers

5. **Token not registering with backend**
   - Verify backend endpoint exists
   - Check network request in logs
   - Ensure user is authenticated

## Security Considerations

1. **Token Storage**: Push tokens are stored in backend database linked to user
2. **Token Rotation**: Re-register token on app updates
3. **Logout**: Unregister token when user logs out
4. **HTTPS Only**: Always use HTTPS for production backend

## Future Enhancements

- [ ] Rich media notifications (images, actions)
- [ ] Notification categories with action buttons
- [ ] Scheduled notifications for assignment reminders
- [ ] Notification analytics (delivery, open rates)
- [ ] Silent/payload-only notifications for data sync
