import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/assignment.dart';
import '../../providers/auth_provider.dart';

final assignmentDetailProvider =
    FutureProvider.family<Assignment, String>((ref, id) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.assignmentById(id));
  return Assignment.fromJson(response.data as Map<String, dynamic>);
});

class AssignmentDetailScreen extends ConsumerStatefulWidget {
  final String assignmentId;
  const AssignmentDetailScreen({super.key, required this.assignmentId});

  @override
  ConsumerState<AssignmentDetailScreen> createState() =>
      _AssignmentDetailScreenState();
}

class _AssignmentDetailScreenState
    extends ConsumerState<AssignmentDetailScreen> {
  final _submissionCtrl = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _submissionCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit(Assignment assignment) async {
    if (_submissionCtrl.text.trim().isEmpty) return;
    setState(() => _isSubmitting = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post(
        ApiEndpoints.submitAssignment(assignment.id),
        data: {'content': _submissionCtrl.text.trim()},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Assignment submitted!'),
            backgroundColor: AppColors.success,
          ),
        );
        ref.invalidate(assignmentDetailProvider(widget.assignmentId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final assignmentAsync =
        ref.watch(assignmentDetailProvider(widget.assignmentId));
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Assignment')),
      body: assignmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (assignment) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              assignment.title,
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                          ),
                          _StatusBadge(assignment.statusLabel),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (assignment.dueDate != null)
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              size: 14,
                              color: assignment.isOverdue
                                  ? AppColors.danger
                                  : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Due ${_formatDate(assignment.dueDate!)}',
                              style: TextStyle(
                                color: assignment.isOverdue
                                    ? AppColors.danger
                                    : AppColors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                            if (assignment.maxScore != null) ...[
                              const SizedBox(width: 16),
                              const Icon(Icons.grade_outlined,
                                  size: 14, color: AppColors.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                '${assignment.maxScore!.toInt()} points',
                                style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 13),
                              ),
                            ],
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Description
              if (assignment.description != null) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Instructions',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 8),
                        Text(
                          assignment.description!,
                          style: const TextStyle(
                              color: AppColors.textSecondary, height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Grade result (if graded)
              if (assignment.mySubmission?.score != null) ...[
                Card(
                  color: AppColors.successLight,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle,
                            color: AppColors.success, size: 32),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Grade',
                                style: TextStyle(
                                    color: AppColors.success,
                                    fontWeight: FontWeight.w600)),
                            Text(
                              '${assignment.mySubmission!.score!.toInt()} / ${assignment.maxScore?.toInt() ?? 100}',
                              style: const TextStyle(
                                  fontSize: 24, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        if (assignment.mySubmission!.feedback != null) ...[
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              assignment.mySubmission!.feedback!,
                              style: const TextStyle(
                                  color: AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Submission form (students only, not yet submitted)
              if (user?.isStudent == true &&
                  assignment.mySubmission == null) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Your Submission',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _submissionCtrl,
                          maxLines: 6,
                          decoration: const InputDecoration(
                            hintText: 'Write your answer here...',
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed:
                              _isSubmitting ? null : () => _submit(assignment),
                          icon: _isSubmitting
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.upload_outlined),
                          label: Text(_isSubmitting
                              ? 'Submitting...'
                              : 'Submit Assignment'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'Graded':
        color = AppColors.success;
        break;
      case 'Submitted':
        color = AppColors.info;
        break;
      case 'Overdue':
        color = AppColors.danger;
        break;
      default:
        color = AppColors.warning;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(status,
          style: TextStyle(
              color: color, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}
