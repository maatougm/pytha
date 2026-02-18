import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/assignment.dart';

final myAssignmentsProvider = FutureProvider<List<Assignment>>((ref) async {
  final api = ref.read(apiClientProvider);
  // Get all classes first, then their assignments
  final classesResp = await api.get(ApiEndpoints.myClasses);
  final classes = classesResp.data as List<dynamic>;
  final assignments = <Assignment>[];
  for (final c in classes) {
    final classId = c['id'] as String;
    try {
      final resp = await api.get(ApiEndpoints.classAssignments(classId));
      final list = resp.data as List<dynamic>;
      assignments.addAll(
        list.map((a) => Assignment.fromJson(a as Map<String, dynamic>)),
      );
    } catch (_) {}
  }
  assignments.sort((a, b) {
    if (a.dueDate == null && b.dueDate == null) return 0;
    if (a.dueDate == null) return 1;
    if (b.dueDate == null) return -1;
    return a.dueDate!.compareTo(b.dueDate!);
  });
  return assignments;
});

class AssignmentsScreen extends ConsumerWidget {
  const AssignmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assignmentsAsync = ref.watch(myAssignmentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Assignments')),
      body: assignmentsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(myAssignmentsProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (assignments) {
          if (assignments.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.assignment_outlined, size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No assignments', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myAssignmentsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: assignments.length,
              itemBuilder: (_, i) => _AssignmentCard(assignment: assignments[i]),
            ),
          );
        },
      ),
    );
  }
}

class _AssignmentCard extends StatelessWidget {
  final Assignment assignment;
  const _AssignmentCard({required this.assignment});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    IconData statusIcon;
    switch (assignment.statusLabel) {
      case 'Graded':
        statusColor = AppColors.success;
        statusIcon = Icons.check_circle_outline;
        break;
      case 'Submitted':
        statusColor = AppColors.info;
        statusIcon = Icons.upload_outlined;
        break;
      case 'Overdue':
        statusColor = AppColors.danger;
        statusIcon = Icons.warning_outlined;
        break;
      default:
        statusColor = AppColors.warning;
        statusIcon = Icons.pending_outlined;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/assignments/${assignment.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(statusIcon, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      assignment.title,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    if (assignment.dueDate != null)
                      Text(
                        'Due ${_formatDate(assignment.dueDate!)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: assignment.isOverdue ? AppColors.danger : AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  assignment.statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}
