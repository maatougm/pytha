import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'api_endpoints.dart';

// Use different base URL for web vs mobile
const String _baseUrl = kIsWeb
    ? String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://localhost:3000',
      )
    : String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://192.168.1.100:3000',
      );

// Secure storage for mobile, Hive for web
final _storage = kIsWeb ? null : const FlutterSecureStorage();
late Box<String>? _webStorage;

Future<void> initStorage() async {
  if (kIsWeb) {
    _webStorage = await Hive.openBox<String>('auth_tokens');
  }
}

/// Read token from storage (works for both web and mobile)
Future<String?> readToken(String key) async {
  if (kIsWeb) {
    return _webStorage?.get(key);
  }
  return _storage?.read(key: key);
}

/// Write token to storage (works for both web and mobile)
Future<void> writeToken(String key, String value) async {
  if (kIsWeb) {
    await _webStorage?.put(key, value);
  } else {
    await _storage?.write(key: key, value: value);
  }
}

/// Delete all tokens from storage (works for both web and mobile)
Future<void> deleteAllTokens() async {
  if (kIsWeb) {
    await _webStorage?.clear();
  } else {
    await _storage?.deleteAll();
  }
}

/// Singleton Dio instance with JWT interceptor and auto-refresh.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(_AuthInterceptor(_dio));
    if (!kReleaseMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: false,
        responseBody: false,
        logPrint: (o) => _appDebugPrint('[API] $o'),
      ));
    }
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);

  Future<Response<T>> post<T>(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  Future<Response<T>> put<T>(String path, {dynamic data}) =>
      _dio.put(path, data: data);

  Future<Response<T>> patch<T>(String path, {dynamic data}) =>
      _dio.patch(path, data: data);

  Future<Response<T>> delete<T>(String path) => _dio.delete(path);

  Future<Response<T>> postFormData<T>(String path, FormData formData) =>
      _dio.post(path, data: formData);
}

class _AuthInterceptor extends Interceptor {
  final Dio _dio;
  bool _isRefreshing = false;

  _AuthInterceptor(this._dio);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await readToken('access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await readToken('refresh_token');
        if (refreshToken == null) {
          _isRefreshing = false;
          return handler.next(err);
        }

        // Use a fresh Dio to avoid interceptor loop
        final refreshDio = Dio(BaseOptions(baseUrl: _baseUrl));
        final response = await refreshDio.post(
          ApiEndpoints.refresh,
          data: {'refreshToken': refreshToken},
        );

        final newAccessToken = response.data['accessToken'] as String;
        final newRefreshToken = response.data['refreshToken'] as String?;

        await writeToken('access_token', newAccessToken);
        if (newRefreshToken != null) {
          await writeToken('refresh_token', newRefreshToken);
        }

        // Retry original request with new token
        err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await _dio.fetch(err.requestOptions);
        _isRefreshing = false;
        return handler.resolve(retryResponse);
      } catch (_) {
        _isRefreshing = false;
        await deleteAllTokens();
        // Signal logout — the router will redirect to login
        return handler.next(err);
      }
    }
    handler.next(err);
  }
}

void _appDebugPrint(String message) {
  // ignore: avoid_print
  print(message);
}
