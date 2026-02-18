import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Good ${_greeting()}, ${user.firstName}!',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text(
              user.primaryRole.toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                color: AppColors.roleColor(user.primaryRole),
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          GestureDetector(
            onTap: () => context.push('/profile'),
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: _Avatar(user: user, radius: 18),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (user.isAdmin) ..._adminCards(context),
              if (user.isTeacher) ..._teacherCards(context),
              if (user.isStudent) ..._studentCards(context, user),
              if (user.isParent) ..._parentCards(context),
            ],
          ),
        ),
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  List<Widget> _adminCards(BuildContext context) => [
        _SectionHeader('Admin Overview'),
        _QuickActionsGrid(actions: [
          _QuickAction('Dashboard', Icons.dashboard_outlined, AppColors.adminColor,
              () => context.go('/admin')),
          _QuickAction('Users', Icons.people_outlined, AppColors.primary,
              () => context.go('/admin/users')),
          _QuickAction('Moderation', Icons.shield_outlined, AppColors.warning,
              () => context.go('/admin/moderation')),
          _QuickAction('Settings', Icons.settings_outlined, AppColors.textSecondary,
              () => context.go('/admin/settings')),
          _QuickAction('Classes', Icons.class_outlined, AppColors.teacherColor,
              () => context.go('/admin/class-composition')),
          _QuickAction('Audit Log', Icons.history_outlined, AppColors.danger,
              () => context.go('/admin/audit')),
        ]),
        const SizedBox(height: 16),
        _NavCard('Messages', Icons.chat_bubble_outlined, AppColors.primary,
            'View all channels', () => context.go('/channels')),
      ];

  List<Widget> _teacherCards(BuildContext context) => [
        _SectionHeader('My Workspace'),
        _QuickActionsGrid(actions: [
          _QuickAction('My Classes', Icons.class_outlined, AppColors.teacherColor,
              () => context.go('/courses')),
          _QuickAction('Messages', Icons.chat_bubble_outlined, AppColors.primary,
              () => context.go('/channels')),
          _QuickAction('Files', Icons.folder_outlined, AppColors.warning,
              () => context.go('/files')),
          _QuickAction('Profile', Icons.person_outlined, AppColors.textSecondary,
              () => context.go('/profile')),
        ]),
      ];

  List<Widget> _studentCards(BuildContext context, AppUser user) => [
        if (user.gradeLevel != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.school, color: Colors.white, size: 32),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Current Grade',
                        style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text(user.gradeLevel!,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
        _SectionHeader('Quick Access'),
        _QuickActionsGrid(actions: [
          _QuickAction('Messages', Icons.chat_bubble_outlined, AppColors.primary,
              () => context.go('/channels')),
          _QuickAction('Courses', Icons.book_outlined, AppColors.teacherColor,
              () => context.go('/courses')),
          _QuickAction('Assignments', Icons.assignment_outlined, AppColors.warning,
              () => context.go('/assignments')),
          _QuickAction('Grades', Icons.grade_outlined, AppColors.success,
              () => context.go('/grades')),
          _QuickAction('Attendance', Icons.calendar_today_outlined, AppColors.info,
              () => context.go('/attendance')),
          _QuickAction('Files', Icons.folder_outlined, AppColors.adminColor,
              () => context.go('/files')),
        ]),
      ];

  List<Widget> _parentCards(BuildContext context) => [
        _SectionHeader('My Children'),
        _NavCard('Messages', Icons.chat_bubble_outlined, AppColors.primary,
            'View all channels', () => context.go('/channels')),
        const SizedBox(height: 8),
        _NavCard('Courses', Icons.book_outlined, AppColors.teacherColor,
            "View children's courses", () => context.go('/courses')),
      ];
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(title, style: Theme.of(context).textTheme.titleLarge),
      );
}

class _QuickAction {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction(this.label, this.icon, this.color, this.onTap);
}

class _QuickActionsGrid extends StatelessWidget {
  final List<_QuickAction> actions;
  const _QuickActionsGrid({required this.actions});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.1,
      children: actions.map((a) => _ActionTile(a)).toList(),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final _QuickAction action;
  const _ActionTile(this.action);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: action.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: action.color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              action.label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _NavCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final String subtitle;
  final VoidCallback onTap;
  const _NavCard(this.title, this.icon, this.color, this.subtitle, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
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
}

class _Avatar extends StatelessWidget {
  final AppUser user;
  final double radius;
  const _Avatar({required this.user, required this.radius});

  @override
  Widget build(BuildContext context) {
    if (user.avatarUrl != null) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(user.avatarUrl!),
      );
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.roleColor(user.primaryRole),
      child: Text(
        user.initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: radius * 0.7,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
