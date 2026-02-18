import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(apiClientProvider));
});

class AuthRepository {
  final ApiClient _api;

  AuthRepository(this._api);

  Future<AuthResult> login(String email, String password) async {
    final response = await _api.post(ApiEndpoints.login, data: {
      'email': email,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    // refreshToken may come in body (Flutter uses body-based refresh)
    final refreshToken = data['refreshToken'] as String?;

    await _writeToken('access_token', accessToken);
    if (refreshToken != null) {
      await _writeToken('refresh_token', refreshToken);
    }

    final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
    return AuthResult(user: user, accessToken: accessToken);
  }

  Future<AuthResult> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String role = 'student',
  }) async {
    final response = await _api.post(ApiEndpoints.register, data: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
    });

    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String?;

    await _writeToken('access_token', accessToken);
    if (refreshToken != null) {
      await _writeToken('refresh_token', refreshToken);
    }

    final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
    return AuthResult(user: user, accessToken: accessToken);
  }

  Future<AppUser> getProfile() async {
    final response = await _api.get(ApiEndpoints.profile);
    return AppUser.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _readToken('refresh_token');
      await _api.post(ApiEndpoints.logout, data: {'refreshToken': refreshToken});
    } catch (_) {}
    await _deleteAllTokens();
  }

  Future<String?> getStoredToken() => _readToken('access_token');

  // Use the same storage pattern as api_client.dart
  Future<String?> _readToken(String key) async {
    return await readToken(key);
  }

  Future<void> _writeToken(String key, String value) async {
    return await writeToken(key, value);
  }

  Future<void> _deleteAllTokens() async {
    return await deleteAllTokens();
  }
}

class AuthResult {
  final AppUser user;
  final String accessToken;
  const AuthResult({required this.user, required this.accessToken});
}
