import { Tabs } from 'expo-router';
import { Home, BookOpen, MessageSquare, FileText, User, Shield, LayoutDashboard, Bell } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useNotificationCenter } from '@/src/hooks/useNotifications';

export default function TabLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotificationCenter();

  const userRole = user?.role || 'student';

  // Determine which tabs to show based on role
  const showAssignments = userRole === 'teacher' || userRole === 'student';
  const showAdmin = userRole === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            fontSize: 10,
          },
        }}
      />
      
      {/* Conditionally show Assignments or Admin tab */}
      {showAssignments && (
        <Tabs.Screen
          name="assignments"
          options={{
            title: 'Assignments',
            tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          }}
        />
      )}
      
      {showAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
