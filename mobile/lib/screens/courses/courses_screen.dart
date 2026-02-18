import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/course.dart';

final myClassesProvider = FutureProvider<List<SchoolClass>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.myClasses);
  final list = response.data as List<dynamic>;
  return list.map((c) => SchoolClass.fromJson(c as Map<String, dynamic>)).toList();
});

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final classesAsync = ref.watch(myClassesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Courses')),
      body: classesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
              const SizedBox(height: 12),
              Text('Failed to load courses'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.refresh(myClassesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (classes) {
          if (classes.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.book_outlined, size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No courses enrolled', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myClassesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: classes.length,
              itemBuilder: (_, i) => _ClassCard(schoolClass: classes[i]),
            ),
          );
        },
      ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  final SchoolClass schoolClass;
  const _ClassCard({required this.schoolClass});

  @override
  Widget build(BuildContext context) {
    final colors = [
      AppColors.primary, AppColors.teacherColor, AppColors.success,
      AppColors.warning, AppColors.adminColor,
    ];
    final color = colors[schoolClass.courseName.hashCode.abs() % colors.length];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/assignments'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    schoolClass.courseCode.length > 3
                        ? schoolClass.courseCode.substring(0, 3)
                        : schoolClass.courseCode,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      schoolClass.courseName,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    if (schoolClass.teacherName != null)
                      Text(
                        schoolClass.teacherName!,
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    if (schoolClass.section != null)
                      Text(
                        'Section ${schoolClass.section} · ${schoolClass.term ?? ''}',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
