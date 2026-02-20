import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
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

  Future<void> connect() async {
    if (_socket?.connected == true) return;

    await _initStorage();
    String? token;

    if (kIsWeb) {
      token = _webStorage?.get('access_token');
    } else {
      // Mobile: read from secure storage via api_client
      token = await readToken('access_token');
    }

    if (token == null) return;

    _socket = io.io(
      '${AppConfig.wsUrl}/messaging',
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
    emit('channel:join', {'channelId': channelId});
  }

  void sendMessage(String channelId, String content, {String? replyTo}) {
    emit('message:send', {
      'channelId': channelId,
      'content': content,
      if (replyTo != null) 'replyTo': replyTo,
    });
  }

  void editMessage(String messageId, String content) {
    emit('message:edit', {'messageId': messageId, 'content': content});
  }

  void deleteMessage(String messageId, String channelId) {
    emit('message:delete', {'messageId': messageId, 'channelId': channelId});
  }

  void startTyping(String channelId) {
    emit('typing:start', {'channelId': channelId});
  }

  void stopTyping(String channelId) {
    emit('typing:stop', {'channelId': channelId});
  }

  void markMessageRead(String messageId, String channelId) {
    emit('message:read', {'messageId': messageId, 'channelId': channelId});
  }

  void addReaction(String messageId, String channelId, String emoji) {
    emit('reaction:add', {
      'messageId': messageId,
      'channelId': channelId,
      'reaction': emoji,
    });
  }

  void removeReaction(String messageId, String channelId, String emoji) {
    emit('reaction:remove', {
      'messageId': messageId,
      'channelId': channelId,
      'reaction': emoji,
    });
  }
}
