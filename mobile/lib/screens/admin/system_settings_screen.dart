import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

class SystemSettingsScreen extends ConsumerStatefulWidget {
  const SystemSettingsScreen({super.key});

  @override
  ConsumerState<SystemSettingsScreen> createState() =>
      _SystemSettingsScreenState();
}

class _SystemSettingsScreenState extends ConsumerState<SystemSettingsScreen> {
  bool _isPromoting = false;

  Future<void> _promoteStudents() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Promote All Students'),
        content: const Text(
          'This will advance all active students to the next grade level. '
          'Grade 12 students will be marked as Graduated. '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
            child: const Text('Promote All'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isPromoting = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post(ApiEndpoints.adminPromoteStudents);
      final data = response.data as Map<String, dynamic>;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Promoted ${data['promoted']} students, ${data['graduated']} graduated.',
            ),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isPromoting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('System Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Academic Year section
          Text('Academic Year', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.school_outlined,
                      color: AppColors.primary),
                  title: const Text('Promote All Students'),
                  subtitle: const Text(
                    'Advance all students to next grade level. Grade 12 → Graduated.',
                  ),
                  trailing: _isPromoting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : ElevatedButton(
                          onPressed: _promoteStudents,
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.warning),
                          child: const Text('Promote'),
                        ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.archive_outlined,
                      color: AppColors.textSecondary),
                  title: const Text('Archive Current Enrollments'),
                  subtitle:
                      const Text('Mark all active enrollments as completed.'),
                  trailing: OutlinedButton(
                    onPressed: () {},
                    child: const Text('Archive'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Messaging section
          Text('Messaging', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.chat_bubble_outlined),
                  title: const Text('Allow Direct Messages'),
                  subtitle:
                      const Text('Students can message each other directly'),
                  value: true,
                  onChanged: (_) {},
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.file_upload_outlined),
                  title: const Text('Allow File Uploads'),
                  subtitle: const Text('Users can upload files in messages'),
                  value: true,
                  onChanged: (_) {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Danger zone
          Text('Danger Zone', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Card(
            color: AppColors.danger.withValues(alpha: 0.05),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: AppColors.danger.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.delete_forever_outlined,
                      color: AppColors.danger),
                  title: const Text('Clear All Messages',
                      style: TextStyle(color: AppColors.danger)),
                  subtitle:
                      const Text('Permanently delete all channel messages'),
                  trailing: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      side: const BorderSide(color: AppColors.danger),
                    ),
                    child: const Text('Clear'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
