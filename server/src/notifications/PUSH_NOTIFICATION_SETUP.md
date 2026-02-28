# Push Notification Backend Setup Guide

## Overview
This guide explains how to implement the backend endpoints required for mobile push notifications using Expo Push Service.

## Required Dependencies

```bash
npm install expo-server-sdk
```

## Implementation

### 1. Create Notification Service

Create `src/notifications/notifications.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo();
  }

  /**
   * Register a push token for a user
   */
  async registerToken(userId: string, token: string, platform: string) {
    // Validate Expo push token
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    // Delete any existing tokens for this device/user combo
    await this.prisma.pushToken.deleteMany({
      where: {
        userId,
        platform,
      },
    });

    // Create new token
    return this.prisma.pushToken.create({
      data: {
        userId,
        token,
        platform,
      },
    });
  }

  /**
   * Unregister a push token
   */
  async unregisterToken(userId: string, token?: string) {
    if (token) {
      await this.prisma.pushToken.deleteMany({
        where: {
          userId,
          token,
        },
      });
    } else {
      // Unregister all tokens for user
      await this.prisma.pushToken.deleteMany({
        where: {
          userId,
        },
      });
    }
  }

  /**
   * Send push notification to a user
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${userId}`);
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: data?.type || 'default',
    }));

    // Send notifications in chunks
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending push notification:', error);
      }
    }

    // Handle tickets and remove invalid tokens
    await this.handleReceipts(tickets, tokens);

    return tickets;
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        this.sendNotification(userId, title, body, data),
      ),
    );

    return results;
  }

  /**
   * Handle push receipt tickets and remove invalid tokens
   */
  private async handleReceipts(
    tickets: ExpoPushTicket[],
    tokens: { token: string }[],
  ) {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i]?.token;

      if (ticket.status === 'error') {
        this.logger.warn(
          `Push notification failed for token ${token}: ${ticket.message}`,
        );

        // Remove invalid tokens
        if (
          ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials'
        ) {
          await this.prisma.pushToken.deleteMany({
            where: { token },
          });
        }
      }
    }
  }

  /**
   * Send new message notification
   */
  async sendMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    channelId: string,
  ) {
    return this.sendNotification(
      recipientId,
      `New message from ${senderName}`,
      messagePreview,
      {
        type: 'message',
        channelId,
      },
    );
  }

  /**
   * Send assignment notification
   */
  async sendAssignmentNotification(
    recipientIds: string[],
    assignmentTitle: string,
    courseName: string,
    assignmentId: string,
  ) {
    return this.sendNotificationToUsers(
      recipientIds,
      'New Assignment',
      `${assignmentTitle} in ${courseName}`,
      {
        type: 'assignment',
        assignmentId,
      },
    );
  }

  /**
   * Send grade notification
   */
  async sendGradeNotification(
    studentId: string,
    assignmentTitle: string,
    grade: string,
    assignmentId: string,
  ) {
    return this.sendNotification(
      studentId,
      'Grade Posted',
      `You received ${grade} on ${assignmentTitle}`,
      {
        type: 'grade',
        assignmentId,
      },
    );
  }
}
```

### 2. Create Notification Controller

Create `src/notifications/notifications.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class RegisterTokenDto {
  token: string;
  platform: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerToken(
    @Request() req,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(
      req.user.userId,
      dto.token,
      dto.platform,
    );
  }

  @Post('unregister-token')
  async unregisterToken(
    @Request() req,
    @Body() dto: { token?: string },
  ) {
    return this.notificationsService.unregisterToken(
      req.user.userId,
      dto.token,
    );
  }
}
```

### 3. Add Prisma Model

Add to `prisma/schema.prisma`:

```prisma
model PushToken {
  id        String   @id @default(uuid())
  userId    String
  token     String
  platform  String   // ios, android, web
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, token])
  @@index([userId])
}
```

### 4. Update User Model

Update `prisma/schema.prisma` User model:

```prisma
model User {
  // ... existing fields ...
  pushTokens PushToken[]
}
```

### 5. Create Notification Module

Create `src/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

### 6. Register Module in App

Update `src/app.module.ts`:

```typescript
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // ... other modules ...
    NotificationsModule,
  ],
})
export class AppModule {}
```

### 7. Run Migration

```bash
npx prisma migrate dev --name add_push_tokens
```

## Integration with Existing Services

### Message Notification Example

Update `src/messaging/messaging.service.ts`:

```typescript
// Inject notifications service
constructor(
  private prisma: PrismaService,
  private notificationsService: NotificationsService,
) {}

// After creating a message
async createMessage(userId: string, data: CreateMessageDto) {
  // ... existing message creation logic ...

  // Send push notification to channel members
  const channelMembers = await this.prisma.channelMember.findMany({
    where: {
      channelId: data.channelId,
      userId: { not: userId }, // Don't notify sender
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const sender = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const senderName = `${sender.firstName} ${senderName.lastName}`;

  for (const member of channelMembers) {
    await this.notificationsService.sendMessageNotification(
      member.userId,
      senderName,
      data.content.substring(0, 100),
      data.channelId,
    );
  }

  return message;
}
```

### Assignment Notification Example

Update `src/grading/grading.service.ts`:

```typescript
async createAssignment(teacherId: string, data: CreateAssignmentDto) {
  // ... existing assignment creation logic ...

  // Get enrolled students
  const enrollments = await this.prisma.classEnrollment.findMany({
    where: { classId: data.classId },
    select: { studentId: true },
  });

  const studentIds = enrollments.map((e) => e.studentId);

  // Get course name
  const course = await this.prisma.course.findUnique({
    where: { id: data.classId },
    select: { name: true },
  });

  // Send notifications
  await this.notificationsService.sendAssignmentNotification(
    studentIds,
    data.title,
    course.name,
    assignment.id,
  );

  return assignment;
}
```

## Testing

### Send Test Notification (Admin Only)

Add to `src/notifications/notifications.controller.ts`:

```typescript
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  // ... existing methods ...

  @Post('test')
  @Roles('admin')
  async sendTestNotification(@Request() req) {
    return this.notificationsService.sendNotification(
      req.user.userId,
      'Test Notification',
      'This is a test push notification from School Hub!',
      { type: 'announcement' },
    );
  }
}
```

## Environment Variables

Add to `.env`:

```env
# No additional env vars needed for Expo Push Service
# Expo handles push delivery automatically
```

## Notes

1. Expo Push Service is free for standard use
2. Push notifications only work on physical devices (not simulators)
3. iOS requires Apple Developer Account for production
4. Android works without additional configuration
5. Consider implementing notification preferences per user
6. Implement retry logic for failed notifications
7. Consider rate limiting for notification endpoints
