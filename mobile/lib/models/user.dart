class AppUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final String? phone;
  final String? gradeLevel;
  final String status;
  final List<String> roles;

  const AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    this.phone,
    this.gradeLevel,
    required this.status,
    required this.roles,
  });

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  bool get isAdmin => roles.contains('admin');
  bool get isTeacher => roles.contains('teacher');
  bool get isStudent => roles.contains('student');
  bool get isParent => roles.contains('parent');

  String get primaryRole {
    if (isAdmin) return 'admin';
    if (isTeacher) return 'teacher';
    if (isStudent) return 'student';
    if (isParent) return 'parent';
    return 'user';
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final userRoles = json['userRoles'] as List<dynamic>? ?? [];
    final roles = userRoles
        .map((r) => (r['role']?['name'] ?? r['name'] ?? '') as String)
        .where((r) => r.isNotEmpty)
        .toList();

    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      phone: json['phone'] as String?,
      gradeLevel: json['gradeLevel'] as String?,
      status: json['status'] as String? ?? 'active',
      roles: roles,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'avatarUrl': avatarUrl,
        'phone': phone,
        'gradeLevel': gradeLevel,
        'status': status,
        'roles': roles,
      };
}
