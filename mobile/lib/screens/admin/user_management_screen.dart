import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';

final adminUsersProvider =
    FutureProvider.family<Map<String, dynamic>, Map<String, String>>(
        (ref, params) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminUsers, params: params);
  return response.data as Map<String, dynamic>;
});

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  String _roleFilter = '';
  int _page = 1;

  Map<String, String> get _params => {
        if (_search.isNotEmpty) 'search': _search,
        if (_roleFilter.isNotEmpty) 'role': _roleFilter,
        'page': '$_page',
        'limit': '20',
      };

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _suspendUser(AppUser user) async {
    final api = ref.read(apiClientProvider);
    try {
      await api.patch(
        ApiEndpoints.adminUserById(user.id),
        data: {'status': user.status == 'suspended' ? 'active' : 'suspended'},
      );
      ref.invalidate(adminUsersProvider(_params));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  Future<void> _deleteUser(AppUser user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete User'),
        content: Text('Delete ${user.fullName}? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child:
                const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final api = ref.read(apiClientProvider);
    try {
      await api.delete(ApiEndpoints.adminUserById(user.id));
      ref.invalidate(adminUsersProvider(_params));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(adminUsersProvider(_params));

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.link),
            tooltip: 'Link Parent to Student',
            onPressed: () => context.push('/admin/users/link-parent'),
          ),
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => context
                .push('/admin/users/create')
                .then((_) => ref.refresh(adminUsersProvider(_params))),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search + filter bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search users...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _search.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _search = '');
                            },
                          )
                        : null,
                  ),
                  onChanged: (v) => setState(() {
                    _search = v;
                    _page = 1;
                  }),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['', 'admin', 'teacher', 'student', 'parent']
                        .map((role) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                label: Text(role.isEmpty ? 'All' : role),
                                selected: _roleFilter == role,
                                onSelected: (_) => setState(() {
                                  _roleFilter = role;
                                  _page = 1;
                                }),
                                selectedColor: AppColors.primaryLight,
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ],
            ),
          ),
          // Users list
          Expanded(
            child: usersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (data) {
                final users = (data['users'] as List<dynamic>? ?? [])
                    .map((u) => AppUser.fromJson(u as Map<String, dynamic>))
                    .toList();
                final total = data['total'] as int? ?? 0;

                if (users.isEmpty) {
                  return const Center(
                    child: Text('No users found',
                        style: TextStyle(color: AppColors.textSecondary)),
                  );
                }

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('$total users found',
                              style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: users.length,
                        itemBuilder: (_, i) => _UserRow(
                          user: users[i],
                          onSuspend: () => _suspendUser(users[i]),
                          onDelete: () => _deleteUser(users[i]),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _UserRow extends StatelessWidget {
  final AppUser user;
  final VoidCallback onSuspend;
  final VoidCallback onDelete;

  const _UserRow({
    required this.user,
    required this.onSuspend,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.primary,
        child: Text(user.fullName[0].toUpperCase()),
      ),
      title: Text(user.fullName),
      subtitle: Text(user.email),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon:
                Icon(user.status == 'suspended' ? Icons.restore : Icons.block),
            onPressed: onSuspend,
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: AppColors.danger),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}
