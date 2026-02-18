import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/channel.dart';

final messagingRepositoryProvider = Provider<MessagingRepository>((ref) {
  return MessagingRepository(ref.read(apiClientProvider));
});

class MessagingRepository {
  final ApiClient _api;
  MessagingRepository(this._api);

  Future<List<Channel>> getMyChannels() async {
    final response = await _api.get(ApiEndpoints.myChannels);
    final list = response.data as List<dynamic>;
    return list.map((c) => Channel.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<List<Message>> getMessages(String channelId, {String? cursor, int limit = 50}) async {
    final response = await _api.get(
      ApiEndpoints.channelMessages(channelId),
      params: {
        if (cursor != null) 'cursor': cursor,
        'limit': limit.toString(),
      },
    );
    final list = response.data as List<dynamic>;
    return list.map((m) => Message.fromJson(m as Map<String, dynamic>)).toList();
  }

  Future<Message> sendMessage(String channelId, String content, {String? fileId}) async {
    final response = await _api.post(
      ApiEndpoints.channelMessages(channelId),
      data: {'content': content, if (fileId != null) 'fileId': fileId},
    );
    return Message.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> markRead(String channelId) async {
    await _api.post(ApiEndpoints.channelRead(channelId));
  }

  Future<List<Channel>> searchChannels(String channelId, String query) async {
    final response = await _api.get(
      ApiEndpoints.channelSearch(channelId),
      params: {'q': query},
    );
    final list = response.data as List<dynamic>;
    return list.map((c) => Channel.fromJson(c as Map<String, dynamic>)).toList();
  }
}

// Providers
final channelsProvider = FutureProvider<List<Channel>>((ref) async {
  return ref.read(messagingRepositoryProvider).getMyChannels();
});

final messagesProvider =
    StateNotifierProvider.family<MessagesNotifier, MessagesState, String>(
  (ref, channelId) => MessagesNotifier(
    ref.read(messagingRepositoryProvider),
    channelId,
  ),
);

class MessagesState {
  final List<Message> messages;
  final bool isLoading;
  final bool hasMore;
  final Set<String> typingUserIds;

  const MessagesState({
    this.messages = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.typingUserIds = const {},
  });

  MessagesState copyWith({
    List<Message>? messages,
    bool? isLoading,
    bool? hasMore,
    Set<String>? typingUserIds,
  }) =>
      MessagesState(
        messages: messages ?? this.messages,
        isLoading: isLoading ?? this.isLoading,
        hasMore: hasMore ?? this.hasMore,
        typingUserIds: typingUserIds ?? this.typingUserIds,
      );
}

class MessagesNotifier extends StateNotifier<MessagesState> {
  final MessagingRepository _repo;
  final String channelId;

  MessagesNotifier(this._repo, this.channelId) : super(const MessagesState()) {
    loadMessages();
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true);
    try {
      final messages = await _repo.getMessages(channelId);
      state = state.copyWith(messages: messages, isLoading: false);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  void addMessage(Message message) {
    state = state.copyWith(messages: [...state.messages, message]);
  }

  void updateMessage(Message updated) {
    state = state.copyWith(
      messages: state.messages.map((m) => m.id == updated.id ? updated : m).toList(),
    );
  }

  void removeMessage(String messageId) {
    state = state.copyWith(
      messages: state.messages.where((m) => m.id != messageId).toList(),
    );
  }

  void setTyping(String userId, bool isTyping) {
    final current = Set<String>.from(state.typingUserIds);
    if (isTyping) {
      current.add(userId);
    } else {
      current.remove(userId);
    }
    state = state.copyWith(typingUserIds: current);
  }
}
