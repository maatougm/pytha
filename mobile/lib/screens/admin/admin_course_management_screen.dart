import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final adminCoursesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.courses);
  final list = response.data['data'] as List<dynamic>;
  return list.cast<Map<String, dynamic>>();
});

class AdminCourseManagementScreen extends ConsumerWidget {
  const AdminCourseManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(adminCoursesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Manage Subjects')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateCourseDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: coursesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (courses) {
          if (courses.isEmpty) {
            return const Center(child: Text('No subjects found'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(adminCoursesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: courses.length,
              itemBuilder: (_, i) {
                final c = courses[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.primaryLight.withOpacity(0.2),
                      child: Text(
                        (c['code'] as String).substring(0, 2),
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text('${c['code']} - ${c['name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(c['department'] ?? 'No Department'),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showCreateCourseDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => const _CreateCourseDialog(),
    ).then((val) {
      if (val == true) ref.refresh(adminCoursesProvider);
    });
  }
}

class _CreateCourseDialog extends ConsumerStatefulWidget {
  const _CreateCourseDialog();
  @override
  ConsumerState<_CreateCourseDialog> createState() => _CreateCourseDialogState();
}

class _CreateCourseDialogState extends ConsumerState<_CreateCourseDialog> {
  final _formKey = GlobalKey<FormState>();
  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _deptCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _creditsCtrl = TextEditingController(text: '3');
  bool _isLoading = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _deptCtrl.dispose();
    _descCtrl.dispose();
    _creditsCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final api = ref.read(apiClientProvider);

    try {
      await api.post(ApiEndpoints.courses, data: {
        'code': _codeCtrl.text.trim().toUpperCase(),
        'name': _nameCtrl.text.trim(),
        'department': _deptCtrl.text.trim(),
        'credits': int.tryParse(_creditsCtrl.text) ?? 1,
        'description': _descCtrl.text.trim(),
      });
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Subject created'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Subject'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _codeCtrl,
                decoration: const InputDecoration(labelText: 'Code (e.g. MATH101)'),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Name (e.g. Algebra I)'),
                validator: (v) => v?.isEmpty == true ? 'Required' : null,
              ),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _deptCtrl,
                      decoration: const InputDecoration(labelText: 'Department'),
                      validator: (v) => v?.isEmpty == true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextFormField(
                      controller: _creditsCtrl,
                      decoration: const InputDecoration(labelText: 'Credits'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              TextFormField(
                controller: _descCtrl,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: _isLoading ? null : _submit, child: const Text('Create')),
      ],
    );
  }
}
