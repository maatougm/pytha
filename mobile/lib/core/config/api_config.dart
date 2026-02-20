/// API Configuration for School Hub
/// Points to your secure server: https://pythagore-init.com
library;

class ApiConfig {
  /// Base API URL - Your secure server
  static const String baseUrl = 'https://pythagore-init.com';

  /// WebSocket URL (secure WebSocket)
  static const String wsUrl = 'wss://pythagore-init.com';

  /// API Version
  static const String apiVersion = '/api';

  /// Full API URL
  static String get apiUrl => '$baseUrl$apiVersion';

  /// Auth endpoints
  static String get loginUrl => '$apiUrl/auth/login';
  static String get registerUrl => '$apiUrl/auth/register';
  static String get refreshUrl => '$apiUrl/auth/refresh';
  static String get profileUrl => '$apiUrl/auth/profile';

  /// Health check
  static String get healthUrl => '$baseUrl/api/health';
}
