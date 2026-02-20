import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:open_filex/open_filex.dart' as open_file;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../core/api/api_client.dart';
import '../core/theme/app_colors.dart';

class UpdateInfo {
  final bool hasUpdate;
  final bool forceUpdate;
  final String version;
  final int versionCode;
  final String? updateUrl;
  final List<String> changelog;
  final String message;

  UpdateInfo({
    required this.hasUpdate,
    required this.forceUpdate,
    required this.version,
    required this.versionCode,
    this.updateUrl,
    required this.changelog,
    required this.message,
  });

  factory UpdateInfo.fromJson(Map<String, dynamic> json) {
    return UpdateInfo(
      hasUpdate: json['hasUpdate'] ?? false,
      forceUpdate: json['forceUpdate'] ?? false,
      version: json['version'] ?? '',
      versionCode: json['versionCode'] ?? 0,
      updateUrl: json['updateUrl'],
      changelog: List<String>.from(json['changelog'] ?? []),
      message: json['message'] ?? '',
    );
  }
}

class UpdateService {
  static final UpdateService _instance = UpdateService._internal();
  factory UpdateService() => _instance;
  UpdateService._internal();

  final ApiClient _api = ApiClient();
  bool _isChecking = false;

  // Get current app version
  Future<int> getCurrentVersionCode() async {
    final packageInfo = await PackageInfo.fromPlatform();
    // Parse version code from buildNumber
    return int.tryParse(packageInfo.buildNumber) ?? 1;
  }

  Future<String> getCurrentVersionName() async {
    final packageInfo = await PackageInfo.fromPlatform();
    return packageInfo.version;
  }

  // Check for updates
  Future<UpdateInfo?> checkForUpdate() async {
    if (_isChecking) return null;
    _isChecking = true;

    try {
      final versionCode = await getCurrentVersionCode();

      final response = await _api.post('/updates/check', data: {
        'versionCode': versionCode,
        'platform': Platform.isAndroid ? 'android' : 'ios',
      });

      return UpdateInfo.fromJson(response.data);
    } catch (e) {
      debugPrint('Update check failed: $e');
      return null;
    } finally {
      _isChecking = false;
    }
  }

  // Download and install update
  Future<bool> downloadAndInstallUpdate(
    String url, {
    Function(double progress)? onProgress,
  }) async {
    try {
      // Request storage permission
      final storageStatus = await Permission.storage.request();
      if (!storageStatus.isGranted) {
        throw Exception('Storage permission denied');
      }

      // For Android 10+, request install unknown apps permission
      if (Platform.isAndroid) {
        final installStatus = await Permission.requestInstallPackages.request();
        if (!installStatus.isGranted) {
          throw Exception('Install permission denied');
        }
      }

      // Get download directory - use appropriate directory based on Android version
      Directory? directory;
      String downloadPath = '';

      if (Platform.isAndroid) {
        directory = await getExternalStorageDirectory();
        // Use Downloads folder for better visibility
        if (directory != null) {
          downloadPath =
              '${directory.parent.path}/Download/minivirson-update.apk';
        }
      } else {
        directory = await getApplicationDocumentsDirectory();
      }

      // Fallback if directory is null or downloadPath is empty
      if (directory == null || downloadPath.isEmpty) {
        directory ??= await getTemporaryDirectory();
        downloadPath = '${directory.path}/minivirson-update.apk';
      }

      // Download APK with better error handling
      final dio = Dio();
      dio.options.connectTimeout = const Duration(seconds: 30);
      dio.options.receiveTimeout =
          const Duration(seconds: 300); // 5 minutes for large APK

      await dio.download(
        url,
        downloadPath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            onProgress?.call(received / total);
          }
        },
      );

      // Verify file was downloaded
      final file = File(downloadPath);
      if (!await file.exists()) {
        throw Exception('Downloaded file not found');
      }

      final fileSize = await file.length();
      if (fileSize < 1000000) {
        // Less than 1MB is suspicious
        throw Exception('Downloaded file is too small ($fileSize bytes)');
      }

      // Install APK
      final result = await open_file.OpenFilex.open(
        downloadPath,
        type: 'application/vnd.android.package-archive',
      );

      return result.type == open_file.ResultType.done ||
          result.message == 'done';
    } catch (e) {
      debugPrint('Download/Install failed: $e');
      return false;
    }
  }

  // Show update dialog
  void showUpdateDialog(
    BuildContext context,
    UpdateInfo updateInfo, {
    bool showSkip = true,
  }) {
    showDialog(
      context: context,
      barrierDismissible: !updateInfo.forceUpdate,
      builder: (context) => UpdateDialog(
        updateInfo: updateInfo,
        showSkip: showSkip && !updateInfo.forceUpdate,
      ),
    );
  }

  // Check and prompt for update
  Future<void> checkAndPromptUpdate(BuildContext context) async {
    final updateInfo = await checkForUpdate();

    if (updateInfo != null && updateInfo.hasUpdate && context.mounted) {
      showUpdateDialog(context, updateInfo);
    }
  }
}

class UpdateDialog extends StatefulWidget {
  final UpdateInfo updateInfo;
  final bool showSkip;

  const UpdateDialog({
    super.key,
    required this.updateInfo,
    this.showSkip = true,
  });

  @override
  State<UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<UpdateDialog> {
  bool _isDownloading = false;
  double _progress = 0.0;

  Future<void> _downloadUpdate() async {
    if (widget.updateInfo.updateUrl == null) return;

    setState(() {
      _isDownloading = true;
      _progress = 0.0;
    });

    final success = await UpdateService().downloadAndInstallUpdate(
      widget.updateInfo.updateUrl!,
      onProgress: (progress) {
        setState(() => _progress = progress);
      },
    );

    if (!success && mounted) {
      setState(() => _isDownloading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Update failed. Please try again.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          Icon(
            Icons.system_update,
            color: widget.updateInfo.forceUpdate
                ? AppColors.danger
                : AppColors.primary,
          ),
          const SizedBox(width: 8),
          Text(widget.updateInfo.forceUpdate
              ? 'Update Required'
              : 'Update Available'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Version ${widget.updateInfo.version} is now available!',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          const Text('What\'s new:',
              style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          ...widget.updateInfo.changelog.map((item) => Padding(
                padding: const EdgeInsets.only(left: 8, bottom: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    Expanded(child: Text(item)),
                  ],
                ),
              )),
          if (_isDownloading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(value: _progress),
            const SizedBox(height: 8),
            Text('Downloading... ${(_progress * 100).toStringAsFixed(0)}%'),
          ],
        ],
      ),
      actions: [
        if (widget.showSkip && !_isDownloading)
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
        if (!_isDownloading)
          ElevatedButton(
            onPressed: _downloadUpdate,
            child: const Text('Update Now'),
          ),
      ],
    );
  }
}
