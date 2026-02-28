import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.backgroundDark,
        },
      }}
    >
      <Stack.Screen
        name="chat/[channelId]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="course/[courseId]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="assignment/[assignmentId]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="channel/info/[channelId]"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="admin/users"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="admin/analytics"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="attendance/mark"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
