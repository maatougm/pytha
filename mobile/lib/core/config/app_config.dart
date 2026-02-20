import 'package:flutter/foundation.dart';

class AppConfig {
  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  // WebSocket Configuration
  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  // App Configuration
  static const String appName = 'MiniVirson';
  static const String appVersion = '1.0.0';

  // Use HTTPS Domain instead of HTTP localhost
  static const String baseUrl = 'https://pythagore-init.com/api';
  static const String wsUrl = 'wss://pythagore-init.com';

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
