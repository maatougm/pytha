import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final classCompositionProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminClassComposition);
  final list = response.data as List<dynamic>;
  return list.cast<Map<String, dynamic>>();
});

class ClassCompositionScreen extends ConsumerStatefulWidget {
  const ClassCompositionScreen({super.key});

  @override
  ConsumerState<ClassCompositionScreen> createState() =>
      _ClassCompositionScreenState();
}

class _ClassCompositionScreenState
    extends ConsumerState<ClassCompositionScreen> {
  String? _selectedClassId;

  @override
  Widget build(BuildContext context) {
    final compositionAsync = ref.watch(classCompositionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Class Composition')),
      body: compositionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(classCompositionProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (classes) {
          if (classes.isEmpty) {
            return const Center(
              child: Text('No classes found',
                  style: TextStyle(color: AppColors.textSecondary)),
            );
          }

          final selectedClass = _selectedClassId != null
              ? classes.firstWhere(
                  (c) => c['id'] == _selectedClassId,
                  orElse: () => classes.first,
                )
              : classes.first;

          return Row(
            children: [
              // Class list sidebar (on wider screens) or dropdown
              if (MediaQuery.of(context).size.width >= 600)
                SizedBox(
                  width: 220,
                  child: _ClassSidebar(
                    classes: classes,
                    selectedId: _selectedClassId ?? classes.first['id'] as String,
                    onSelect: (id) => setState(() => _selectedClassId = id),
                  ),
                )
              else
                const SizedBox.shrink(),

              // Main content
              Expanded(
                child: Column(
                  children: [
                    // Class selector for narrow screens
                    if (MediaQuery.of(context).size.width < 600)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: DropdownButtonFormField<String>(
                          value: _selectedClassId ?? classes.first['id'] as String,
                          decoration: const InputDecoration(labelText: 'Select Class'),
                          items: classes.map((c) {
                            return DropdownMenuItem<String>(
                              value: c['id'] as String,
                              child: Text(
                                '${c['name']} - Sec ${c['section']}',
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (id) => setState(() => _selectedClassId = id),
                        ),
                      ),
                    // Students in class
                    Expanded(
                      child: _ClassStudentsList(
                        classData: selectedClass,
                        onRemoveStudent: (enrollmentId) async {
                          await _removeStudent(enrollmentId);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _removeStudent(String enrollmentId) async {
    final api = ref.read(apiClientProvider);
    try {
      await api.delete(ApiEndpoints.adminEnrollment(enrollmentId));
      ref.refresh(classCompositionProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Student removed from class'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}

class _ClassSidebar extends StatelessWidget {
  final List<Map<String, dynamic>> classes;
  final String selectedId;
  final void Function(String) onSelect;

  const _ClassSidebar({
    required this.classes,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(right: BorderSide(color: AppColors.border)),
      ),
      child: ListView.builder(
        itemCount: classes.length,
        itemBuilder: (_, i) {
          final c = classes[i];
          final isSelected = c['id'] == selectedId;
          final students = (c['students'] as List?)?.length ?? 0;
          final max = c['maxStudents'] as int? ?? 0;

          return ListTile(
            selected: isSelected,
            selectedTileColor: AppColors.primaryLight,
            title: Text(
              c['name'] as String? ?? 'Class',
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
                fontSize: 13,
              ),
            ),
            subtitle: Text(
              'Sec ${c['section']} · $students/$max',
              style: const TextStyle(fontSize: 11),
            ),
            onTap: () => onSelect(c['id'] as String),
          );
        },
      ),
    );
  }
}

class _ClassStudentsList extends StatelessWidget {
  final Map<String, dynamic> classData;
  final Future<void> Function(String enrollmentId) onRemoveStudent;

  const _ClassStudentsList({
    required this.classData,
    required this.onRemoveStudent,
  });

  @override
  Widget build(BuildContext context) {
    final students = (classData['students'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();
    final max = classData['maxStudents'] as int? ?? 0;

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      classData['name'] as String? ?? 'Class',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      '${students.length} / $max students',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              LinearProgressIndicator(
                value: max > 0 ? students.length / max : 0,
                backgroundColor: AppColors.border,
                valueColor: AlwaysStoppedAnimation(
                  students.length >= max ? AppColors.danger : AppColors.success,
                ),
              ).let((w) => SizedBox(width: 80, child: w)),
            ],
          ),
        ),
        const Divider(height: 1),
        // Student list
        Expanded(
          child: students.isEmpty
              ? const Center(
                  child: Text('No students enrolled',
                      style: TextStyle(color: AppColors.textSecondary)),
                )
              : ListView.builder(
                  itemCount: students.length,
                  itemBuilder: (_, i) {
                    final s = students[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary,
                        backgroundImage: s['avatarUrl'] != null
                            ? NetworkImage(s['avatarUrl'] as String)
                            : null,
                        child: s['avatarUrl'] == null
                            ? Text(
                                '${s['firstName']?[0] ?? '?'}',
                                style: const TextStyle(color: Colors.white),
                              )
                            : null,
                      ),
                      title: Text('${s['firstName']} ${s['lastName']}'),
                      subtitle: Text(s['gradeLevel'] as String? ?? ''),
                      trailing: IconButton(
                        icon: const Icon(Icons.remove_circle_outline,
                            color: AppColors.danger),
                        onPressed: () => onRemoveStudent(s['enrollmentId'] as String),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

extension _WidgetLet on Widget {
  T let<T>(T Function(Widget) fn) => fn(this);
}
