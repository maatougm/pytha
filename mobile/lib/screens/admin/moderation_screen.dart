import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';

final reportsProvider = FutureProvider.family<Map<String, dynamic>, String>(
    (ref, status) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.moderationReports,
    params: status.isEmpty ? {} : {'status': status},
  );
  return response.data as Map<String, dynamic>;
});

class ModerationScreen extends ConsumerStatefulWidget {
  const ModerationScreen({super.key});

  @override
  ConsumerState<ModerationScreen> createState() => _ModerationScreenState();
}

class _ModerationScreenState extends ConsumerState<ModerationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  static const _statuses = ['', 'pending', 'investigating', 'resolved', 'dismissed'];
  static const _labels = ['All', 'Pending', 'Investigating', 'Resolved', 'Dismissed'];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _statuses.length, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Moderation'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: _labels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: _statuses
            .map((s) => _ReportsList(status: s))
            .toList(),
      ),
    );
  }
}

class _ReportsList extends ConsumerWidget {
  final String status;
  const _ReportsList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportsAsync = ref.watch(reportsProvider(status));

    return reportsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: ElevatedButton(
          onPressed: () => ref.refresh(reportsProvider(status)),
          child: const Text('Retry'),
        ),
      ),
      data: (data) {
        final reports = data['reports'] as List<dynamic>? ?? [];
        if (reports.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shield_outlined, size: 64, color: AppColors.textMuted),
                SizedBox(height: 16),
                Text('No reports', style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: reports.length,
          itemBuilder: (_, i) {
            final report = reports[i] as Map<String, dynamic>;
            return _ReportCard(
              report: report,
              onUpdateStatus: (newStatus) async {
                final api = ref.read(apiClientProvider);
                await api.patch(
                  ApiEndpoints.moderationReportById(report['id'] as String),
                  data: {'status': newStatus},
                );
                ref.refresh(reportsProvider(status));
              },
            );
          },
        );
      },
    );
  }
}

class _ReportCard extends StatelessWidget {
  final Map<String, dynamic> report;
  final Future<void> Function(String status) onUpdateStatus;

  const _ReportCard({required this.report, required this.onUpdateStatus});

  @override
  Widget build(BuildContext context) {
    final reportStatus = report['status'] as String? ?? 'pending';
    Color statusColor;
    switch (reportStatus) {
      case 'resolved': statusColor = AppColors.success; break;
      case 'dismissed': statusColor = AppColors.textMuted; break;
      case 'investigating': statusColor = AppColors.warning; break;
      default: statusColor = AppColors.danger;
    }

    final reporter = report['reporter'] as Map<String, dynamic>?;
    final channel = report['channel'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    report['reason'] as String? ?? 'Report',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    reportStatus,
                    style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            if (reporter != null)
              Text(
                'Reported by: ${reporter['firstName']} ${reporter['lastName']}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            if (channel != null)
              Text(
                'Channel: #${channel['name']}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            if (report['description'] != null) ...[
              const SizedBox(height: 6),
              Text(
                report['description'] as String,
                style: const TextStyle(fontSize: 13),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (reportStatus == 'pending') ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => onUpdateStatus('investigating'),
                      child: const Text('Investigate'),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                if (reportStatus != 'resolved')
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => onUpdateStatus('resolved'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                      child: const Text('Resolve'),
                    ),
                  ),
                if (reportStatus != 'dismissed') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => onUpdateStatus('dismissed'),
                      child: const Text('Dismiss'),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
