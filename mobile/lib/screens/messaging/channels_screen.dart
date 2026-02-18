import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/messaging_provider.dart';
import '../../models/channel.dart';
import '../../core/theme/app_colors.dart';

class ChannelsScreen extends ConsumerWidget {
  const ChannelsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final channelsAsync = ref.watch(channelsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(icon: const Icon(Icons.add), onPressed: () {}),
        ],
      ),
      body: channelsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
              const SizedBox(height: 12),
              Text('Failed to load channels', style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.refresh(channelsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (channels) {
          if (channels.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.textMuted),
                  SizedBox(height: 16),
                  Text('No channels yet', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(channelsProvider),
            child: ListView.separated(
              itemCount: channels.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, indent: 72),
              itemBuilder: (_, i) => _ChannelTile(channel: channels[i]),
            ),
          );
        },
      ),
    );
  }
}

class _ChannelTile extends StatelessWidget {
  final Channel channel;
  const _ChannelTile({required this.channel});

  @override
  Widget build(BuildContext context) {
    final unread = channel.unreadCount ?? 0;
    final lastMsg = channel.lastMessage;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: _ChannelAvatar(channel: channel),
      title: Row(
        children: [
          Expanded(
            child: Text(
              channel.name,
              style: TextStyle(
                fontWeight: unread > 0 ? FontWeight.w700 : FontWeight.w500,
                fontSize: 15,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (lastMsg != null)
            Text(
              _formatTime(lastMsg.createdAt),
              style: TextStyle(
                fontSize: 11,
                color: unread > 0 ? AppColors.primary : AppColors.textMuted,
                fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              lastMsg?.isDeleted == true
                  ? 'Message deleted'
                  : lastMsg?.content ?? channel.description ?? '',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: unread > 0 ? AppColors.textPrimary : AppColors.textSecondary,
                fontWeight: unread > 0 ? FontWeight.w500 : FontWeight.normal,
                fontSize: 13,
              ),
            ),
          ),
          if (unread > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                unread > 99 ? '99+' : '$unread',
                style: const TextStyle(
                    color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
      onTap: () => context.push('/channels/${channel.id}'),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[dt.weekday - 1];
    }
    return '${dt.day}/${dt.month}';
  }
}

class _ChannelAvatar extends StatelessWidget {
  final Channel channel;
  const _ChannelAvatar({required this.channel});

  @override
  Widget build(BuildContext context) {
    if (channel.avatarUrl != null) {
      return CircleAvatar(
        radius: 24,
        backgroundImage: NetworkImage(channel.avatarUrl!),
      );
    }
    final color = _colorFromName(channel.name);
    return CircleAvatar(
      radius: 24,
      backgroundColor: color,
      child: Text(
        channel.name.isNotEmpty ? channel.name[0].toUpperCase() : '#',
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
      ),
    );
  }

  Color _colorFromName(String name) {
    const colors = [
      AppColors.primary, AppColors.teacherColor, AppColors.success,
      AppColors.warning, AppColors.adminColor, AppColors.info,
    ];
    return colors[name.hashCode.abs() % colors.length];
  }
}
