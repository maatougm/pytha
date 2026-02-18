import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/messaging/channels_screen.dart';
import '../screens/messaging/chat_screen.dart';
import '../screens/courses/courses_screen.dart';
import '../screens/assignments/assignments_screen.dart';
import '../screens/assignments/assignment_detail_screen.dart';
import '../screens/grades/grades_screen.dart';
import '../screens/attendance/attendance_screen.dart';
import '../screens/files/files_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/admin/admin_shell_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/admin/user_management_screen.dart';
import '../screens/admin/moderation_screen.dart';
import '../screens/admin/audit_logs_screen.dart';
import '../screens/admin/system_settings_screen.dart';
import '../screens/admin/admin_classes_screen.dart';
import '../screens/admin/class_composition_screen.dart';
import '../screens/admin/teacher_allocation_screen.dart';
import '../screens/admin/admin_user_creation_screen.dart';
import '../screens/admin/admin_parent_link_screen.dart';
import '../screens/admin/admin_class_creation_screen.dart';
import '../screens/admin/admin_course_management_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (isLoading) return null;
      if (!isAuthenticated && !isAuthRoute) return '/login';
      if (isAuthenticated && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      // ─── Auth ──────────────────────────────────────────────────────────────
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),

      // ─── Main App ──────────────────────────────────────────────────────────
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),

      // Messaging
      GoRoute(path: '/channels', builder: (_, __) => const ChannelsScreen()),
      GoRoute(
        path: '/channels/:id',
        builder: (_, state) => ChatScreen(channelId: state.pathParameters['id']!),
      ),

      // Courses
      GoRoute(path: '/courses', builder: (_, __) => const CoursesScreen()),

      // Assignments
      GoRoute(path: '/assignments', builder: (_, __) => const AssignmentsScreen()),
      GoRoute(
        path: '/assignments/:id',
        builder: (_, state) =>
            AssignmentDetailScreen(assignmentId: state.pathParameters['id']!),
      ),

      // Grades
      GoRoute(path: '/grades', builder: (_, __) => const GradesScreen()),

      // Attendance
      GoRoute(path: '/attendance', builder: (_, __) => const AttendanceScreen()),

      // Files
      GoRoute(path: '/files', builder: (_, __) => const FilesScreen()),

      // Profile
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),

      // ─── Admin ─────────────────────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => AdminShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/admin',
            builder: (_, __) => const AdminDashboardScreen(),
          ),
          GoRoute(
            path: '/admin/users',
            builder: (_, __) => const UserManagementScreen(),
            routes: [
              GoRoute(
                path: 'create',
                builder: (_, __) => const AdminUserCreationScreen(),
              ),
              GoRoute(
                path: 'link-parent',
                builder: (_, __) => const AdminParentLinkScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/admin/moderation',
            builder: (_, __) => const ModerationScreen(),
          ),
          GoRoute(
            path: '/admin/audit',
            builder: (_, __) => const AuditLogsScreen(),
          ),
          GoRoute(
            path: '/admin/settings',
            builder: (_, __) => const SystemSettingsScreen(),
          ),
          GoRoute(
            path: '/admin/courses',
            builder: (_, __) => const AdminCourseManagementScreen(),
          ),
          GoRoute(
            path: '/admin/classes',
            builder: (_, __) => const AdminClassesScreen(),
            routes: [
              GoRoute(
                path: 'create',
                builder: (_, __) => const AdminClassCreationScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/admin/class-composition',
            builder: (_, __) => const ClassCompositionScreen(),
          ),
          GoRoute(
            path: '/admin/teacher-allocations',
            builder: (_, __) => const TeacherAllocationScreen(),
          ),
        ],
      ),
    ],
  );
});
