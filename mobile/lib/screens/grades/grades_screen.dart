import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/assignment.dart';

final myGradesProvider = FutureProvider<List<Grade>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.myGrades);
  final list = response.data as List<dynamic>;
  return list.map((g) => Grade.fromJson(g as Map<String, dynamic>)).toList();
});

class GradesScreen extends ConsumerWidget {
  const GradesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradesAsync = ref.watch(myGradesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Grades')),
      body: gradesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(myGradesProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (grades) {
          if (grades.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.grade_outlined,
                      size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No grades yet',
                      style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }

          // Calculate GPA-like average
          final avg = grades.isEmpty
              ? 0.0
              : grades.map((g) => g.percentage).reduce((a, b) => a + b) /
                  grades.length;

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myGradesProvider),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            _GradeCircle(percentage: avg),
                            const SizedBox(width: 20),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Overall Average',
                                    style: TextStyle(
                                        color: AppColors.textSecondary)),
                                Text(
                                  '${avg.toStringAsFixed(1)}%',
                                  style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  '${grades.length} graded assignments',
                                  style: const TextStyle(
                                      color: AppColors.textMuted, fontSize: 12),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _GradeCard(grade: grades[i]),
                      childCount: grades.length,
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _GradeCircle extends StatelessWidget {
  final double percentage;
  const _GradeCircle({required this.percentage});

  @override
  Widget build(BuildContext context) {
    Color color;
    if (percentage >= 90) {
      color = AppColors.success;
    } else if (percentage >= 70) {
      color = AppColors.info;
    } else if (percentage >= 60) {
      color = AppColors.warning;
    } else {
      color = AppColors.danger;
    }

    return SizedBox(
      width: 72,
      height: 72,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: percentage / 100,
            strokeWidth: 6,
            backgroundColor: color.withValues(alpha: 0.15),
            valueColor: AlwaysStoppedAnimation(color),
          ),
          Text(
            _letterGrade(percentage),
            style: TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }

  String _letterGrade(double p) {
    if (p >= 90) return 'A';
    if (p >= 80) return 'B';
    if (p >= 70) return 'C';
    if (p >= 60) return 'D';
    return 'F';
  }
}

class _GradeCard extends StatelessWidget {
  final Grade grade;
  const _GradeCard({required this.grade});

  @override
  Widget build(BuildContext context) {
    Color color;
    if (grade.percentage >= 90) {
      color = AppColors.success;
    } else if (grade.percentage >= 70) {
      color = AppColors.info;
    } else if (grade.percentage >= 60) {
      color = AppColors.warning;
    } else {
      color = AppColors.danger;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(grade.assignmentTitle,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(grade.courseName,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${grade.score.toInt()}/${grade.maxScore.toInt()}',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, color: color, fontSize: 16),
                ),
                Text(
                  '${grade.percentage.toStringAsFixed(0)}%',
                  style: TextStyle(color: color, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
