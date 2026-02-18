import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration
  static const String apiBaseUrl = kIsWeb
      ? String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://localhost:3000',
        )
      : String.fromEnvironment(
          'API_BASE_URL',
          defaultValue: 'http://192.168.1.100:3000',
        );

  // WebSocket Configuration  
  static const String wsBaseUrl = kIsWeb
      ? String.fromEnvironment(
          'WS_BASE_URL',
          defaultValue: 'http://localhost:3000',
        )
      : String.fromEnvironment(
          'WS_BASE_URL',
          defaultValue: 'http://192.168.1.100:3000',
        );

  // App Configuration
  static const String appName = 'School Hub';
  static const String appVersion = '1.0.0';

  // Feature Flags
  static const bool enableLogging = !kReleaseMode;
  static const bool enableAnalytics = true;

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // File Upload
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // Cache Duration
  static const Duration cacheDuration = Duration(minutes: 5);
  static const Duration tokenRefreshThreshold = Duration(minutes: 5);
}
