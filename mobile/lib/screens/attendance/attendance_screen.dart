import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/file_model.dart';

final myAttendanceProvider =
    FutureProvider<List<AttendanceRecord>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.myAttendance);
  final list = response.data as List<dynamic>;
  return list
      .map((a) => AttendanceRecord.fromJson(a as Map<String, dynamic>))
      .toList();
});

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceAsync = ref.watch(myAttendanceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: attendanceAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(myAttendanceProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (records) {
          final total = records.length;
          final present = records.where((r) => r.isPresent).length;
          final absent = records.where((r) => r.isAbsent).length;
          final late = records.where((r) => r.isLate).length;
          final rate = total > 0 ? (present / total * 100) : 0.0;

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myAttendanceProvider),
            child: CustomScrollView(
              slivers: [
                // Stats header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Text('Attendance Rate',
                                    style:
                                        Theme.of(context).textTheme.titleLarge),
                                const SizedBox(height: 12),
                                SizedBox(
                                  height: 120,
                                  width: 120,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      CircularProgressIndicator(
                                        value: rate / 100,
                                        strokeWidth: 10,
                                        backgroundColor: AppColors.border,
                                        valueColor: AlwaysStoppedAnimation(
                                          rate >= 80
                                              ? AppColors.success
                                              : rate >= 60
                                                  ? AppColors.warning
                                                  : AppColors.danger,
                                        ),
                                      ),
                                      Text(
                                        '${rate.toStringAsFixed(0)}%',
                                        style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w800),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: [
                                    _StatChip(
                                        'Present', present, AppColors.success),
                                    _StatChip(
                                        'Absent', absent, AppColors.danger),
                                    _StatChip('Late', late, AppColors.warning),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Records list
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _AttendanceRow(record: records[i]),
                      childCount: records.length,
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

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _StatChip(this.label, this.count, this.color);

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Text('$count',
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 12)),
        ],
      );
}

class _AttendanceRow extends StatelessWidget {
  final AttendanceRecord record;
  const _AttendanceRow({required this.record});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    switch (record.status) {
      case 'present':
        color = AppColors.success;
        icon = Icons.check_circle_outline;
        break;
      case 'late':
        color = AppColors.warning;
        icon = Icons.access_time_outlined;
        break;
      case 'excused':
        color = AppColors.info;
        icon = Icons.info_outline;
        break;
      default:
        color = AppColors.danger;
        icon = Icons.cancel_outlined;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Icon(icon, color: color),
        title: Text(_formatDate(record.date)),
        subtitle: record.note != null ? Text(record.note!) : null,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            record.status[0].toUpperCase() + record.status.substring(1),
            style: TextStyle(
                color: color, fontWeight: FontWeight.w600, fontSize: 12),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[dt.weekday - 1]}, ${months[dt.month - 1]} ${dt.day}';
  }
}
