import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dropdown_search/dropdown_search.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';

class AdminParentLinkScreen extends ConsumerStatefulWidget {
  const AdminParentLinkScreen({super.key});

  @override
  ConsumerState<AdminParentLinkScreen> createState() => _AdminParentLinkScreenState();
}

class _AdminParentLinkScreenState extends ConsumerState<AdminParentLinkScreen> {
  String? _selectedParentId;
  String? _selectedStudentId;
  bool _isLoading = false;

  Future<List<AppUser>> _searchUsers(String role, String query) async {
    final api = ref.read(apiClientProvider);
    final res = await api.get('/admin/users', params: {'role': role, 'search': query});
    final list = res.data['users'] as List<dynamic>;
    return list.map((u) => AppUser.fromJson(u)).toList();
  }

  Future<void> _submit() async {
    if (_selectedParentId == null || _selectedStudentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both parent and student')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final api = ref.read(apiClientProvider);

    try {
      await api.post('/admin/users/link-parent', data: {
        'parentId': _selectedParentId,
        'studentId': _selectedStudentId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Linked successfully'), backgroundColor: AppColors.success),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to link: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Link Parent to Student')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Select Parent', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownSearch<AppUser>(
              popupProps: const PopupProps.menu(
                showSearchBox: true,
                searchFieldProps: TextFieldProps(decoration: InputDecoration(hintText: 'Search parent name...')),
              ),
              asyncItems: (String filter) => _searchUsers('parent', filter),
              itemAsString: (AppUser u) => '${u.fullName} (${u.email})',
              onChanged: (AppUser? data) => setState(() => _selectedParentId = data?.id),
              dropdownDecoratorProps: const DropDownDecoratorProps(
                dropdownSearchDecoration: InputDecoration(
                  labelText: "Parent",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.family_restroom),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Select Student', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            DropdownSearch<AppUser>(
              popupProps: const PopupProps.menu(
                showSearchBox: true,
                searchFieldProps: TextFieldProps(decoration: InputDecoration(hintText: 'Search student name...')),
              ),
              asyncItems: (String filter) => _searchUsers('student', filter),
              itemAsString: (AppUser u) => '${u.fullName} (${u.email})',
              onChanged: (AppUser? data) => setState(() => _selectedStudentId = data?.id),
              dropdownDecoratorProps: const DropDownDecoratorProps(
                dropdownSearchDecoration: InputDecoration(
                  labelText: "Student",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.school),
                ),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                : const Text('Link Parent & Student'),
            ),
          ],
        ),
      ),
    );
  }
}
