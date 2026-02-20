import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final adminMetricsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminMetrics);
  return response.data as Map<String, dynamic>;
});

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(adminMetricsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(adminMetricsProvider),
          ),
        ],
      ),
      body: metricsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AppColors.danger,
              ),
              const SizedBox(height: 12),
              Text('$e'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.refresh(adminMetricsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (metrics) {
          final users = metrics['users'] as Map<String, dynamic>? ?? {};
          final messages = metrics['messages'] as Map<String, dynamic>? ?? {};
          final channels = metrics['channels'] as Map<String, dynamic>? ?? {};

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(adminMetricsProvider),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Overview',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      _MetricCard(
                        'Total Users',
                        '${users['total'] ?? 0}',
                        Icons.people_outlined,
                        AppColors.primary,
                        subtitle: '${users['active'] ?? 0} active',
                      ),
                      _MetricCard(
                        'Messages',
                        '${messages['total'] ?? 0}',
                        Icons.chat_bubble_outlined,
                        AppColors.teacherColor,
                        subtitle: 'Today: ${messages['today'] ?? 0}',
                      ),
                      _MetricCard(
                        'Channels',
                        '${channels['total'] ?? 0}',
                        Icons.forum_outlined,
                        AppColors.success,
                        subtitle: '${channels['active'] ?? 0} active',
                      ),
                      _MetricCard(
                        'Online Now',
                        '${metrics['onlineUsers'] ?? 0}',
                        Icons.circle,
                        AppColors.success,
                        subtitle: 'Live users',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  _ActionRow(
                    icon: Icons.people_outlined,
                    color: AppColors.primary,
                    title: 'User Management',
                    subtitle: 'Add, edit, suspend users',
                    onTap: () => context.push('/admin/users'),
                  ),
                  _ActionRow(
                    icon: Icons.book_outlined,
                    color: AppColors.primary,
                    title: 'Manage Subjects',
                    subtitle: 'Create and edit courses',
                    onTap: () => context.push('/admin/courses'),
                  ),
                  _ActionRow(
                    icon: Icons.class_outlined,
                    color: AppColors.teacherColor,
                    title: 'Classes',
                    subtitle: 'Manage class sections',
                    onTap: () => context.push('/admin/classes'),
                  ),
                  _ActionRow(
                    icon: Icons.group_work_outlined,
                    color: AppColors.teacherColor,
                    title: 'Class Composition',
                    subtitle: 'Drag-and-drop student assignment',
                    onTap: () => context.push('/admin/class-composition'),
                  ),
                  _ActionRow(
                    icon: Icons.person_pin_outlined,
                    color: AppColors.warning,
                    title: 'Teacher Allocations',
                    subtitle: 'Assign teachers to classes',
                    onTap: () => context.push('/admin/teacher-allocations'),
                  ),
                  _ActionRow(
                    icon: Icons.shield_outlined,
                    color: AppColors.danger,
                    title: 'Moderation',
                    subtitle: 'Review reports and content',
                    onTap: () => context.push('/admin/moderation'),
                  ),
                  _ActionRow(
                    icon: Icons.history_outlined,
                    color: AppColors.adminColor,
                    title: 'Audit Logs',
                    subtitle: 'View all admin actions',
                    onTap: () => context.push('/admin/audit'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? subtitle;

  const _MetricCard(
    this.title,
    this.value,
    this.icon,
    this.color, {
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
              Icon(icon, color: color, size: 18),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle!,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 8),
    child: ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    ),
  );
}
