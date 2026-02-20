import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dropdown_search/dropdown_search.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';
import '../../models/course.dart';

class AdminClassCreationScreen extends ConsumerStatefulWidget {
  const AdminClassCreationScreen({super.key});

  @override
  ConsumerState<AdminClassCreationScreen> createState() => _AdminClassCreationScreenState();
}

class _AdminClassCreationScreenState extends ConsumerState<AdminClassCreationScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedCourseId;
  String? _selectedTeacherId;
  final _termCtrl = TextEditingController();
  final _sectionCtrl = TextEditingController();
  final _roomCtrl = TextEditingController();
  final _maxStudentsCtrl = TextEditingController(text: '30');
  bool _isLoading = false;

  @override
  void dispose() {
    _termCtrl.dispose();
    _sectionCtrl.dispose();
    _roomCtrl.dispose();
    _maxStudentsCtrl.dispose();
    super.dispose();
  }

  Future<List<SchoolClass>> _searchCourses(String query) async {
    final api = ref.read(apiClientProvider);
    final res = await api.get(ApiEndpoints.courses, params: {'search': query});
    final list = res.data['data'] as List<dynamic>;
    // Mapping raw course data to SchoolClass just for ID/Name, or create a simple Course model
    // Assuming backend returns list of courses with id, name, code
    return list.map((c) => SchoolClass(
      id: c['id'],
      courseName: c['name'],
      courseCode: c['code'],
      // dummy values for required fields
      term: '', 
      section: '', 
      schedules: [],
    )).toList();
  }

  Future<List<AppUser>> _searchTeachers(String query) async {
    final api = ref.read(apiClientProvider);
    final res = await api.get('/admin/users', params: {'role': 'teacher', 'search': query});
    final list = res.data['users'] as List<dynamic>;
    return list.map((u) => AppUser.fromJson(u)).toList();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCourseId == null || _selectedTeacherId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select Course and Teacher')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final api = ref.read(apiClientProvider);

    try {
      await api.post(ApiEndpoints.classes, data: {
        'courseId': _selectedCourseId,
        'teacherId': _selectedTeacherId,
        'term': _termCtrl.text.trim(),
        'section': _sectionCtrl.text.trim(),
        'room': _roomCtrl.text.trim(),
        'maxStudents': int.tryParse(_maxStudentsCtrl.text) ?? 30,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Class created successfully'), backgroundColor: AppColors.success),
        );
        context.pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create class: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Class')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Course (Subject)', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownSearch<SchoolClass>(
                popupProps: const PopupProps.menu(
                  showSearchBox: true,
                  searchFieldProps: TextFieldProps(decoration: InputDecoration(hintText: 'Search course code/name...')),
                ),
                asyncItems: _searchCourses,
                itemAsString: (c) => '${c.courseCode} - ${c.courseName}',
                onChanged: (c) => setState(() => _selectedCourseId = c?.id),
                dropdownDecoratorProps: const DropDownDecoratorProps(
                  dropdownSearchDecoration: InputDecoration(
                    labelText: "Select Course",
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.book),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Teacher', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownSearch<AppUser>(
                popupProps: const PopupProps.menu(
                  showSearchBox: true,
                  searchFieldProps: TextFieldProps(decoration: InputDecoration(hintText: 'Search teacher...')),
                ),
                asyncItems: _searchTeachers,
                itemAsString: (u) => '${u.fullName} (${u.email})',
                onChanged: (u) => setState(() => _selectedTeacherId = u?.id),
                dropdownDecoratorProps: const DropDownDecoratorProps(
                  dropdownSearchDecoration: InputDecoration(
                    labelText: "Select Teacher",
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _termCtrl,
                      decoration: const InputDecoration(labelText: 'Term (e.g. Spring 2026)'),
                      validator: (v) => v?.isEmpty == true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _sectionCtrl,
                      decoration: const InputDecoration(labelText: 'Section (e.g. A)'),
                      validator: (v) => v?.isEmpty == true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _roomCtrl,
                      decoration: const InputDecoration(labelText: 'Room'),
                      validator: (v) => v?.isEmpty == true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _maxStudentsCtrl,
                      decoration: const InputDecoration(labelText: 'Max Students'),
                      keyboardType: TextInputType.number,
                      validator: (v) => v?.isEmpty == true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                  : const Text('Create Class'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
