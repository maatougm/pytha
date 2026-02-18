import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import '../api/api_client.dart';
import '../config/app_config.dart';

// Use different transports for web vs mobile
// Web needs polling first, mobile can use websocket directly
final _transports = kIsWeb ? ['polling', 'websocket'] : ['websocket'];

final socketServiceProvider = Provider<SocketService>((ref) => SocketService());

class SocketService {
  io.Socket? _socket;
  Box<String>? _webStorage;
  bool _initialized = false;

  io.Socket? get socket => _socket;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> _initStorage() async {
    if (_initialized) return;
    if (kIsWeb) {
      _webStorage = await Hive.openBox<String>('auth_tokens');
    }
    _initialized = true;
  }

  Future<String?> _readToken() async {
    await _initStorage();
    if (kIsWeb) {
      return _webStorage?.get('access_token');
    }
    // For mobile, use the same initStorage from api_client
    return null;
  }

  Future<void> connect() async {
    if (_socket?.connected == true) return;

    await _initStorage();
    String? token;
    
    if (kIsWeb) {
      token = _webStorage?.get('access_token');
    } else {
      // Mobile uses secure storage - need to import and use the same method
      // For now, return as token management is handled by api_client
      return;
    }
    
    if (token == null) return;

    _socket = io.io(
      AppConfig.wsBaseUrl,
      io.OptionBuilder()
          .setTransports(_transports)
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) => debugPrint('[Socket] Connected'));
    _socket!.onDisconnect((_) => debugPrint('[Socket] Disconnected'));
    _socket!.onConnectError((e) => debugPrint('[Socket] Connect error: $e'));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }

  void on(String event, Function(dynamic) handler) {
    _socket?.on(event, handler);
  }

  void off(String event) {
    _socket?.off(event);
  }

  // ─── Messaging Events ─────────────────────────────────────────────────────

  void joinChannel(String channelId) {
    emit('join_channel', {'channelId': channelId});
  }

  void sendMessage(String channelId, String content, {String? fileId}) {
    emit('send_message', {
      'channelId': channelId,
      'content': content,
      if (fileId != null) 'fileId': fileId,
    });
  }

  void editMessage(String messageId, String content) {
    emit('edit_message', {'messageId': messageId, 'content': content});
  }

  void deleteMessage(String messageId, String channelId) {
    emit('delete_message', {'messageId': messageId, 'channelId': channelId});
  }

  void startTyping(String channelId) {
    emit('typing_start', {'channelId': channelId});
  }

  void stopTyping(String channelId) {
    emit('typing_stop', {'channelId': channelId});
  }

  void markMessageRead(String messageId, String channelId) {
    emit('message_read', {'messageId': messageId, 'channelId': channelId});
  }

  void addReaction(String messageId, String channelId, String emoji) {
    emit('add_reaction', {
      'messageId': messageId,
      'channelId': channelId,
      'emoji': emoji,
    });
  }

  void removeReaction(String messageId, String channelId, String emoji) {
    emit('remove_reaction', {
      'messageId': messageId,
      'channelId': channelId,
      'emoji': emoji,
    });
  }
}
