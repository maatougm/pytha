import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/theme/app_colors.dart';
import '../../models/file_model.dart';

final myFilesProvider = FutureProvider<List<FileModel>>((ref) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.myFiles);
  final list = response.data as List<dynamic>;
  return list.map((f) => FileModel.fromJson(f as Map<String, dynamic>)).toList();
});

class FilesScreen extends ConsumerWidget {
  const FilesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filesAsync = ref.watch(myFilesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Files'),
        actions: [
          IconButton(
            icon: const Icon(Icons.upload_outlined),
            onPressed: () => _showUploadDialog(context, ref),
          ),
        ],
      ),
      body: filesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: ElevatedButton(
            onPressed: () => ref.refresh(myFilesProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (files) {
          if (files.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.folder_open_outlined,
                      size: 64, color: AppColors.textMuted),
                  const SizedBox(height: 16),
                  const Text('No files yet',
                      style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => _showUploadDialog(context, ref),
                    icon: const Icon(Icons.upload_outlined),
                    label: const Text('Upload File'),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(myFilesProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: files.length,
              itemBuilder: (_, i) => _FileCard(file: files[i]),
            ),
          );
        },
      ),
    );
  }

  void _showUploadDialog(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Upload File', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.folder_outlined),
              title: const Text('Choose file'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _FileCard extends StatelessWidget {
  final FileModel file;
  const _FileCard({required this.file});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(file.icon, style: const TextStyle(fontSize: 22)),
          ),
        ),
        title: Text(
          file.originalName,
          style: const TextStyle(fontWeight: FontWeight.w500),
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${file.sizeLabel} · ${_formatDate(file.createdAt)}',
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (action) {
            // TODO: handle download / delete
          },
          itemBuilder: (_) => [
            const PopupMenuItem(value: 'download', child: Text('Download')),
            const PopupMenuItem(value: 'delete', child: Text('Delete')),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}
