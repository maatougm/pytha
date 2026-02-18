import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final auditLogsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminAuditLogs);
  final list = response.data as List<dynamic>;
  return list.cast<Map<String, dynamic>>();
});

class AuditLogsScreen extends ConsumerWidget {
  const AuditLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(auditLogsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Audit Logs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(auditLogsProvider),
          ),
        ],
      ),
      body: logsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (logs) {
          if (logs.isEmpty) {
            return const Center(
              child: Text('No audit logs', style: TextStyle(color: AppColors.textSecondary)),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: logs.length,
            itemBuilder: (_, i) => _AuditLogRow(log: logs[i]),
          );
        },
      ),
    );
  }
}

class _AuditLogRow extends StatelessWidget {
  final Map<String, dynamic> log;
  const _AuditLogRow({required this.log});

  @override
  Widget build(BuildContext context) {
    final action = log['action'] as String? ?? '';
    final actor = log['actor'] as Map<String, dynamic>?;
    final createdAt = log['createdAt'] != null
        ? DateTime.tryParse(log['createdAt'] as String)
        : null;

    Color actionColor;
    IconData actionIcon;
    if (action.contains('delete') || action.contains('ban') || action.contains('suspend')) {
      actionColor = AppColors.danger;
      actionIcon = Icons.remove_circle_outline;
    } else if (action.contains('create') || action.contains('add') || action.contains('promote')) {
      actionColor = AppColors.success;
      actionIcon = Icons.add_circle_outline;
    } else if (action.contains('update') || action.contains('edit') || action.contains('assign')) {
      actionColor = AppColors.warning;
      actionIcon = Icons.edit_outlined;
    } else {
      actionColor = AppColors.info;
      actionIcon = Icons.info_outline;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: actionColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(actionIcon, color: actionColor, size: 18),
        ),
        title: Text(
          _formatAction(action),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (actor != null)
              Text(
                'by ${actor['firstName']} ${actor['lastName']}',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            if (createdAt != null)
              Text(
                _formatDateTime(createdAt),
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
          ],
        ),
        onTap: () => _showDetails(context, log),
      ),
    );
  }

  String _formatAction(String action) {
    return action.replaceAll('_', ' ').split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }

  String _formatDateTime(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  void _showDetails(BuildContext context, Map<String, dynamic> log) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Audit Log Details', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            ...log.entries.where((e) => e.key != 'actor').map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 100,
                      child: Text(e.key,
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                    ),
                    Expanded(
                      child: Text(
                        '${e.value}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
