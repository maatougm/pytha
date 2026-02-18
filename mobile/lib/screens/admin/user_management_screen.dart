import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';

final adminUsersProvider = FutureProvider.family<Map<String, dynamic>, Map<String, String>>(
    (ref, params) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.adminUsers, params: params);
  return response.data as Map<String, dynamic>;
});

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() => _UserManagementScreenState();
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

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(adminUsersProvider(_params));

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => _showCreateUserDialog(context),
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
                    child: Text('No users found', style: TextStyle(color: AppColors.textSecondary)),
                  );
                }

                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('$total users found',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
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

  Future<void> _suspendUser(AppUser user) async {
    final api = ref.read(apiClientProvider);
    try {
      await api.patch(
        ApiEndpoints.adminUserById(user.id),
        data: {'status': user.status == 'suspended' ? 'active' : 'suspended'},
      );
      ref.refresh(adminUsersProvider(_params));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
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
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final api = ref.read(apiClientProvider);
    try {
      await api.delete(ApiEndpoints.adminUserById(user.id));
      ref.refresh(adminUsersProvider(_params));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  void _showCreateUserDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => const _CreateUserDialog(),
    );
  }
}

class _UserRow extends StatelessWidget {
  final AppUser user;
  final VoidCallback onSuspend;
  final VoidCallback onDelete;

  const _UserRow({required this.user, required this.onSuspend, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final roleColor = AppColors.roleColor(user.primaryRole);
    final isSuspended = user.status == 'suspended';

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: roleColor,
        backgroundImage: user.avatarUrl != null ? NetworkImage(user.avatarUrl!) : null,
        child: user.avatarUrl == null
            ? Text(user.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))
            : null,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              user.fullName,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isSuspended ? AppColors.textMuted : AppColors.textPrimary,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: roleColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              user.primaryRole,
              style: TextStyle(color: roleColor, fontSize: 10, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      subtitle: Text(
        user.email,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      trailing: PopupMenuButton<String>(
        onSelected: (action) {
          if (action == 'suspend') onSuspend();
          if (action == 'delete') onDelete();
        },
        itemBuilder: (_) => [
          PopupMenuItem(
            value: 'suspend',
            child: Text(isSuspended ? 'Reactivate' : 'Suspend'),
          ),
          const PopupMenuItem(
            value: 'delete',
            child: Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _CreateUserDialog extends StatefulWidget {
  const _CreateUserDialog();

  @override
  State<_CreateUserDialog> createState() => _CreateUserDialogState();
}

class _CreateUserDialogState extends State<_CreateUserDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  String _role = 'student';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Create User'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _firstCtrl,
                    decoration: const InputDecoration(labelText: 'First name'),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _lastCtrl,
                    decoration: const InputDecoration(labelText: 'Last name'),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _emailCtrl,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) => v?.contains('@') == false ? 'Invalid email' : null,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _role,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['student', 'teacher', 'parent', 'admin']
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (v) => setState(() => _role = v!),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) Navigator.pop(context);
          },
          child: const Text('Create'),
        ),
      ],
    );
  }
}
