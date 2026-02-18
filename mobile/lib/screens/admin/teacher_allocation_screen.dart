import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final teacherAllocationsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminTeacherAllocations);
  final list = response.data as List<dynamic>;
  return list.cast<Map<String, dynamic>>();
});

final unallocatedClassesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminClasses);
  final list = response.data as List<dynamic>;
  return (list.cast<Map<String, dynamic>>())
      .where((c) => c['teacher'] == null)
      .toList();
});

class TeacherAllocationScreen extends ConsumerWidget {
  const TeacherAllocationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allocationsAsync = ref.watch(teacherAllocationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Teacher Allocations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAssignDialog(context, ref),
          ),
        ],
      ),
      body: allocationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(teacherAllocationsProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (allocations) {
          if (allocations.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.person_pin_outlined,
                      size: 64, color: AppColors.textMuted),
                  const SizedBox(height: 16),
                  const Text('No allocations yet',
                      style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _showAssignDialog(context, ref),
                    icon: const Icon(Icons.add),
                    label: const Text('Assign Teacher'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(teacherAllocationsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: allocations.length,
              itemBuilder: (_, i) {
                final a = allocations[i];
                final teacher = a['teacher'] as Map<String, dynamic>?;
                final schoolClass = a['class'] as Map<String, dynamic>?;
                final course = schoolClass?['course'] as Map<String, dynamic>?;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.teacherColor,
                      backgroundImage: teacher?['avatarUrl'] != null
                          ? NetworkImage(teacher!['avatarUrl'] as String)
                          : null,
                      child: teacher?['avatarUrl'] == null
                          ? Text(
                              '${teacher?['firstName']?[0] ?? 'T'}',
                              style: const TextStyle(
                                  color: Colors.white, fontWeight: FontWeight.w700),
                            )
                          : null,
                    ),
                    title: Text(
                      teacher != null
                          ? '${teacher['firstName']} ${teacher['lastName']}'
                          : 'Unknown Teacher',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course?['name'] as String? ?? 'Unknown Course'),
                        Text(
                          'Section ${schoolClass?['section'] ?? ''} · ${schoolClass?['term'] ?? ''}',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.remove_circle_outline,
                          color: AppColors.danger),
                      onPressed: () => _removeAllocation(context, ref, a['id'] as String),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _removeAllocation(
      BuildContext context, WidgetRef ref, String allocationId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remove Allocation'),
        content: const Text('Remove this teacher from the class?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    final api = ref.read(apiClientProvider);
    try {
      await api.delete(ApiEndpoints.adminTeacherAllocationById(allocationId));
      ref.refresh(teacherAllocationsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  void _showAssignDialog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _AssignTeacherSheet(),
    );
  }
}

class _AssignTeacherSheet extends ConsumerStatefulWidget {
  const _AssignTeacherSheet();

  @override
  ConsumerState<_AssignTeacherSheet> createState() => _AssignTeacherSheetState();
}

class _AssignTeacherSheetState extends ConsumerState<_AssignTeacherSheet> {
  String? _selectedTeacherId;
  String? _selectedClassId;
  bool _isAssigning = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Assign Teacher to Class',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          // Teacher selector (simplified - would load from API)
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Teacher ID',
              hintText: 'Enter teacher ID',
            ),
            onChanged: (v) => setState(() => _selectedTeacherId = v),
          ),
          const SizedBox(height: 12),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Class ID',
              hintText: 'Enter class ID',
            ),
            onChanged: (v) => setState(() => _selectedClassId = v),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: (_selectedTeacherId?.isNotEmpty == true &&
                    _selectedClassId?.isNotEmpty == true &&
                    !_isAssigning)
                ? () => _assign()
                : null,
            child: _isAssigning
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Assign'),
          ),
        ],
      ),
    );
  }

  Future<void> _assign() async {
    setState(() => _isAssigning = true);
    final api = ref.read(apiClientProvider);
    try {
      await api.post(
        ApiEndpoints.adminTeacherAllocations,
        data: {
          'teacherId': _selectedTeacherId,
          'classId': _selectedClassId,
        },
      );
      ref.refresh(teacherAllocationsProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isAssigning = false);
    }
  }
}
