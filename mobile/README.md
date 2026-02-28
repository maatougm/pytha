# School Hub Mobile App

A modern, cross-platform mobile application for School Hub - a comprehensive school management system facilitating real-time messaging, course management, assignments, and role-based communication between administrators, teachers, parents, and students.

## 🚀 Features

- **Real-time Messaging**: WebSocket-powered instant messaging with support for channels, direct messages, and group conversations
- **Course Management**: Browse courses, view class schedules, and track enrollments
- **Assignment Tracking**: Submit assignments, track deadlines, and view grades
- **Attendance Monitoring**: Mark and view attendance records
- **File Sharing**: Upload and download files with secure access control
- **Role-Based Access**: Four user roles (Admin, Teacher, Parent, Student) with tailored experiences
- **Offline Support**: Cached data with TanStack Query for seamless offline experience
- **Push Notifications**: Real-time notifications for messages, assignments, and announcements

## 📱 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Expo](https://expo.dev) SDK 55+ |
| **UI** | [React Native](https://reactnative.dev) 0.83+ |
| **Navigation** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based) |
| **State Management** | [TanStack Query](https://tanstack.com/query) (React Query) v5 |
| **Real-time** | [Socket.IO Client](https://socket.io/docs/v4/client-api/) v4 |
| **Styling** | React Native StyleSheet |
| **Icons** | [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) |
| **Storage** | [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| **Charts** | [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit) |

## 📂 Project Structure

```
mobile/
├── app/                          # Expo Router file-based routing
│   ├── (app)/                    # Protected app routes
│   │   ├── _layout.tsx           # App layout with stack navigation
│   │   ├── admin/                # Admin-only screens
│   │   │   ├── analytics.tsx
│   │   │   └── users.tsx
│   │   ├── assignment/           # Assignment detail
│   │   │   └── [assignmentId].tsx
│   │   ├── attendance/           # Attendance screens
│   │   │   └── mark.tsx
│   │   ├── channel/              # Channel info
│   │   │   └── info/
│   │   │       └── [channelId].tsx
│   │   ├── chat/                 # Chat screen
│   │   │   └── [channelId].tsx
│   │   └── course/               # Course detail
│   │       └── [courseId].tsx
│   ├── (auth)/                   # Authentication routes
│   │   ├── _layout.tsx
│   │   ├── forgot-password.tsx
│   │   ├── login.tsx
│   │   └── role-select.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── courses.tsx
│   │   ├── messages.tsx
│   │   ├── assignments.tsx
│   │   └── profile.tsx
│   ├── +not-found.tsx            # 404 screen
│   ├── modal.tsx                 # Global modal
│   └── _layout.tsx               # Root layout with providers
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAssignments.ts
│   │   ├── useChannels.ts
│   │   ├── useChat.ts
│   │   ├── useCourses.ts
│   │   ├── useDashboard.ts
│   │   ├── useMessages.ts
│   │   ├── useProfile.ts
│   │   └── useSocket.ts
│   ├── providers/                # React Context providers
│   │   ├── AuthProvider.tsx      # Authentication state
│   │   ├── QueryProvider.tsx     # TanStack Query config
│   │   ├── SocketProvider.tsx    # WebSocket connection
│   │   └── ThemeProvider.tsx     # Theme/colors
│   ├── services/                 # API service functions
│   │   ├── api-client.ts         # HTTP client with interceptors
│   │   ├── auth.service.ts
│   │   ├── course.service.ts
│   │   ├── messaging.service.ts
│   │   ├── socket.service.ts
│   │   ├── user.service.ts
│   │   ├── grading.service.ts
│   │   ├── attendance.service.ts
│   │   ├── file.service.ts
│   │   ├── admin.service.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript types
│   │   └── api.ts                # API types mirroring backend
│   └── utils/                    # Utility functions
│       ├── constants.ts          # App constants
│       └── helpers.ts            # Helper functions
├── providers/                    # App-level providers (root)
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   └── ThemeProvider.tsx
├── assets/                       # Static assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
├── .env.example                  # Environment template
├── app.json                      # Expo configuration
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org) 18+ 
- [npm](https://npmjs.com) 9+ or [yarn](https://yarnpkg.com)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional, for global commands)
- iOS Simulator (macOS) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API URLs
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web
   - Scan QR code with Expo Go app for physical device

## ⚙️ Environment Setup

Create a `.env` file in the `mobile/` directory:

```env
# Required
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WS_URL=http://localhost:3000
EXPO_PUBLIC_APP_NAME=School Hub

# Optional
EXPO_PUBLIC_ENABLE_BIOMETRIC=true
EXPO_PUBLIC_DEBUG=false
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |
| `EXPO_PUBLIC_WS_URL` | WebSocket server URL | `http://localhost:3000` |
| `EXPO_PUBLIC_APP_NAME` | App display name | `School Hub` |
| `EXPO_PUBLIC_ENV` | Environment name | `development` |
| `EXPO_PUBLIC_DEBUG` | Enable debug logging | `false` |

## 🧭 Navigation Structure

```
Root Stack
├── (auth) - Authentication group
│   ├── login
│   ├── forgot-password
│   └── role-select
├── (tabs) - Main tabs (requires auth)
│   ├── index (Home)
│   ├── courses
│   ├── messages
│   ├── assignments
│   └── profile
└── (app) - Deep screens (requires auth)
    ├── chat/[channelId]
    ├── course/[courseId]
    ├── assignment/[assignmentId]
    ├── channel/info/[channelId]
    ├── admin/analytics (admin only)
    ├── admin/users (admin only)
    └── attendance/mark
```

## 🔄 State Management

The app uses **TanStack Query (React Query)** for server state management:

```typescript
// Example: Fetching courses
const { data, isLoading, error } = useQuery({
  queryKey: ['courses'],
  queryFn: courseService.getCourses,
});

// Example: Mutations
const mutation = useMutation({
  mutationFn: courseService.enrollStudent,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  },
});
```

### Query Keys Convention

| Feature | Query Key |
|---------|-----------|
| User profile | `['profile']` |
| Courses list | `['courses']` |
| Course detail | `['course', courseId]` |
| Messages | `['messages', channelId]` |
| Assignments | `['assignments']` |

## 🔌 API Integration

The `api-client.ts` provides a configured HTTP client with:

- **Automatic token injection** via request interceptors
- **Token refresh** on 401 responses
- **Error handling** with custom `ApiError` class
- **Secure storage** using Expo Secure Store

```typescript
import { get, post, put, del } from '@/services/api-client';

// GET request
const user = await get<User>('/users/me');

// POST request
const newCourse = await post<Course>('/courses', { name: 'Math 101' });

// File upload
const formData = new FormData();
formData.append('file', file);
const upload = await post('/files/upload', formData);
```

## ⚡ WebSocket Usage

Real-time messaging uses Socket.IO:

```typescript
import { useSocket } from '@/src/hooks/useSocket';

function ChatScreen({ channelId }) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join channel
    socket.emit('channel:join', channelId);

    // Listen for messages
    socket.on('message:new', (message) => {
      // Handle new message
    });

    return () => {
      socket.off('message:new');
    };
  }, [socket, channelId]);

  const sendMessage = (content: string) => {
    socket?.emit('message:send', {
      channelId,
      content,
    });
  };
}
```

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `channel:join` | → | Join a channel room |
| `message:send` | → | Send a message |
| `message:edit` | → | Edit a message |
| `message:delete` | → | Delete a message |
| `message:new` | ← | New message received |
| `message:updated` | ← | Message was edited |
| `message:deleted` | ← | Message was deleted |
| `typing:start` | →/← | Typing indicator |

## 👥 Role-Based Access

Four user roles with different permissions:

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features, user management, analytics, system settings |
| **Teacher** | Create courses, manage classes, grade assignments, communicate with students/parents |
| **Parent** | View child's progress, communicate with teachers, receive notifications |
| **Student** | View courses, submit assignments, participate in class discussions |

### Role Guard Component

```typescript
import { useAuth } from '@/providers/AuthProvider';

function AdminOnlyFeature() {
  const { user } = useAuth();
  
  if (user?.roles?.[0]?.role.name !== 'admin') {
    return null; // or redirect
  }
  
  return <AdminPanel />;
}
```

## 🎨 Theme System

The app uses a centralized theme system:

```typescript
import { useTheme } from '@/providers/ThemeProvider';

function MyComponent() {
  const { colors, spacing, borderRadius } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    }}>
      <Text style={{ color: colors.primary }}>Hello</Text>
    </View>
  );
}
```

### Theme Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1e1e8a` | Primary brand color, buttons |
| `primaryDark` | `#151560` | Hover/active states |
| `accent` | `#f59e0b` | Highlights, badges |
| `success` | `#10b981` | Success states |
| `error` | `#ef4444` | Errors |
| `background` | `#ffffff` | Page background |
| `surface` | `#ffffff` | Cards, inputs |
| `text` | `#111827` | Primary text |
| `textSecondary` | `#6b7280` | Secondary text |

## 🐛 Troubleshooting

### Common Issues

#### Metro bundler cache issues
```bash
npx expo start --clear
```

#### iOS build failures
```bash
cd ios && pod install && cd ..
```

#### Android build failures
```bash
cd android && ./gradlew clean && cd ..
```

#### TypeScript errors
```bash
npx tsc --noEmit
```

### Network Issues

If you're having trouble connecting to the backend:

1. **Physical device**: Use your computer's IP address instead of `localhost`
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
   EXPO_PUBLIC_WS_URL=http://192.168.1.100:3000
   ```

2. **Check backend is running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **CORS configuration**: Ensure backend allows requests from your device

### Environment Variable Issues

If env vars aren't loading:
- Restart the Metro bundler after changing `.env`
- Ensure variable names start with `EXPO_PUBLIC_`
- Run `npx expo start --clear` to clear cache

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start web version |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## 📄 License

This project is part of the School Hub (Pythagore/Minivirson) system.
