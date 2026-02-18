import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/messaging_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/socket/socket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../models/channel.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String channelId;
  const ChatScreen({super.key, required this.channelId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _setupSocket();
  }

  void _setupSocket() {
    final socket = ref.read(socketServiceProvider);
    socket.joinChannel(widget.channelId);

    socket.on('new_message', (data) {
      final msg = Message.fromJson(data as Map<String, dynamic>);
      if (msg.channelId == widget.channelId) {
        ref.read(messagesProvider(widget.channelId).notifier).addMessage(msg);
        _scrollToBottom();
      }
    });

    socket.on('message_edited', (data) {
      final msg = Message.fromJson(data as Map<String, dynamic>);
      ref.read(messagesProvider(widget.channelId).notifier).updateMessage(msg);
    });

    socket.on('message_deleted', (data) {
      final id = (data as Map<String, dynamic>)['messageId'] as String;
      ref.read(messagesProvider(widget.channelId).notifier).removeMessage(id);
    });

    socket.on('typing_start', (data) {
      final userId = (data as Map<String, dynamic>)['userId'] as String;
      final me = ref.read(currentUserProvider)?.id;
      if (userId != me) {
        ref.read(messagesProvider(widget.channelId).notifier).setTyping(userId, true);
      }
    });

    socket.on('typing_stop', (data) {
      final userId = (data as Map<String, dynamic>)['userId'] as String;
      ref.read(messagesProvider(widget.channelId).notifier).setTyping(userId, false);
    });
  }

  @override
  void dispose() {
    final socket = ref.read(socketServiceProvider);
    socket.off('new_message');
    socket.off('message_edited');
    socket.off('message_deleted');
    socket.off('typing_start');
    socket.off('typing_stop');
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _onTextChanged(String text) {
    final socket = ref.read(socketServiceProvider);
    if (text.isNotEmpty && !_isTyping) {
      _isTyping = true;
      socket.startTyping(widget.channelId);
    } else if (text.isEmpty && _isTyping) {
      _isTyping = false;
      socket.stopTyping(widget.channelId);
    }
  }

  Future<void> _sendMessage() async {
    final content = _inputCtrl.text.trim();
    if (content.isEmpty) return;
    _inputCtrl.clear();
    if (_isTyping) {
      _isTyping = false;
      ref.read(socketServiceProvider).stopTyping(widget.channelId);
    }
    ref.read(socketServiceProvider).sendMessage(widget.channelId, content);
  }

  @override
  Widget build(BuildContext context) {
    final messagesState = ref.watch(messagesProvider(widget.channelId));
    final me = ref.watch(currentUserProvider);
    final messages = messagesState.messages;
    final typingIds = messagesState.typingUserIds;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Channel',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            if (typingIds.isNotEmpty)
              Text(
                '${typingIds.length == 1 ? 'Someone is' : '${typingIds.length} people are'} typing...',
                style: const TextStyle(fontSize: 11, color: AppColors.primary),
              ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.people_outline), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: messagesState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : messages.isEmpty
                    ? const Center(
                        child: Text('No messages yet. Say hello! 👋',
                            style: TextStyle(color: AppColors.textSecondary)),
                      )
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        itemCount: messages.length,
                        itemBuilder: (_, i) {
                          final msg = messages[i];
                          final isMe = msg.senderId == me?.id;
                          final showAvatar = i == 0 ||
                              messages[i - 1].senderId != msg.senderId;
                          return _MessageBubble(
                            message: msg,
                            isMe: isMe,
                            showAvatar: showAvatar,
                            onReact: (emoji) {
                              ref.read(socketServiceProvider).addReaction(
                                    msg.id,
                                    widget.channelId,
                                    emoji,
                                  );
                            },
                          );
                        },
                      ),
          ),

          // Typing indicator
          if (typingIds.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 4),
              child: Row(
                children: [
                  _TypingDots(),
                  const SizedBox(width: 8),
                  Text('typing...', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),

          // Input bar
          _MessageInput(
            controller: _inputCtrl,
            onChanged: _onTextChanged,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;
  final bool showAvatar;
  final void Function(String emoji) onReact;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.showAvatar,
    required this.onReact,
  });

  @override
  Widget build(BuildContext context) {
    if (message.isDeleted) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            Text(
              'Message deleted',
              style: TextStyle(
                color: AppColors.textMuted,
                fontStyle: FontStyle.italic,
                fontSize: 13,
              ),
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onLongPress: () => _showReactionPicker(context),
      child: Padding(
        padding: EdgeInsets.only(
          top: showAvatar ? 8 : 2,
          bottom: 2,
        ),
        child: Row(
          mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isMe && showAvatar)
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary,
                backgroundImage: message.senderAvatar != null
                    ? NetworkImage(message.senderAvatar!)
                    : null,
                child: message.senderAvatar == null
                    ? Text(
                        (message.senderName ?? '?')[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      )
                    : null,
              )
            else if (!isMe)
              const SizedBox(width: 32),
            const SizedBox(width: 8),
            Flexible(
              child: Column(
                crossAxisAlignment:
                    isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (showAvatar && !isMe)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 2, left: 4),
                      child: Text(
                        message.senderName ?? 'Unknown',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: Radius.circular(isMe ? 16 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 16),
                      ),
                      border: isMe
                          ? null
                          : Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.content,
                          style: TextStyle(
                            color: isMe ? Colors.white : AppColors.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _formatTime(message.createdAt),
                              style: TextStyle(
                                fontSize: 10,
                                color: isMe
                                    ? Colors.white.withOpacity(0.7)
                                    : AppColors.textMuted,
                              ),
                            ),
                            if (message.isEdited) ...[
                              const SizedBox(width: 4),
                              Text(
                                '(edited)',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isMe
                                      ? Colors.white.withOpacity(0.7)
                                      : AppColors.textMuted,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Reactions
                  if (message.reactions.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Wrap(
                        spacing: 4,
                        children: message.reactions.entries.map((e) {
                          return GestureDetector(
                            onTap: () => onReact(e.key),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                              ),
                              child: Text(
                                '${e.key} ${e.value.length}',
                                style: const TextStyle(fontSize: 12),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  void _showReactionPicker(BuildContext context) {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: emojis
              .map((e) => GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      onReact(e);
                    },
                    child: Text(e, style: const TextStyle(fontSize: 32)),
                  ))
              .toList(),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
}

class _TypingDots extends StatefulWidget {
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        return Row(
          children: List.generate(3, (i) {
            final delay = i * 0.3;
            final value = (_ctrl.value - delay).clamp(0.0, 1.0);
            final opacity = (value < 0.5 ? value * 2 : (1 - value) * 2).clamp(0.3, 1.0);
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(opacity),
                shape: BoxShape.circle,
              ),
            );
          }),
        );
      },
    );
  }
}

class _MessageInput extends StatelessWidget {
  final TextEditingController controller;
  final void Function(String) onChanged;
  final VoidCallback onSend;

  const _MessageInput({
    required this.controller,
    required this.onChanged,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.attach_file, color: AppColors.textSecondary),
            onPressed: () {},
          ),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              maxLines: null,
              textInputAction: TextInputAction.newline,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: const TextStyle(color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.backgroundLight,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onSend,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
