import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import {
  Search,
  Plus,
  BookOpen,
  Users,
  Megaphone,
  User,
  ChevronRight,
  MessageCircle,
  GraduationCap,
  Baby,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { useChannels } from '@/src/hooks/useChannels';
import { useSocketContext } from '@/src/providers/SocketProvider';
import type { Channel } from '@/services/api';

const CHANNEL_TYPE_ICONS: Record<string, React.ReactNode> = {
  classroom: <BookOpen size={16} color="#fff" />,
  direct_message: <User size={16} color="#fff" />,
  teacher_parent: <Users size={16} color="#fff" />,
  admin_broadcast: <Megaphone size={16} color="#fff" />,
  group: <MessageCircle size={16} color="#fff" />,
};

const CHANNEL_TYPE_COLORS: Record<string, string> = {
  classroom: '#3b82f6',
  direct_message: '#10b981',
  teacher_parent: '#8b5cf6',
  admin_broadcast: '#f59e0b',
  group: '#ec4899',
};

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  classroom: 'Class',
  direct_message: 'Direct',
  teacher_parent: 'Parent',
  admin_broadcast: 'Broadcast',
  group: 'Group',
};

// Format timestamp for last message
function formatTimestamp(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin, isTeacher, isParent } = useRole();
  const { isConnected } = useSocketContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Use the new real-time enabled useChannels hook
  const {
    channels,
    isLoading,
    refetch,
    clearUnreadCount,
    totalUnreadCount,
  } = useChannels(user?.id || '');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredChannels = channels?.filter((channel) => {
    if (searchQuery) {
      return channel.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleCreateChannel = () => {
    router.push('/(app)/channel/create' as Href);
  };

  const handleBroadcast = () => {
    router.push('/(app)/channel/broadcast' as Href);
  };

  const handleChannelPress = useCallback((channel: Channel) => {
    // Clear unread count for this channel
    clearUnreadCount(channel.id);

    // Navigate to chat screen
    router.push({
      pathname: '/(app)/chat/[channelId]',
      params: { channelId: channel.id },
    });
  }, [clearUnreadCount]);

  const highlightMentions = (text: string) => {
    // Simple mention highlighting - @username
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Text key={index} style={{ color: colors.primary, fontWeight: '600' }}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const renderChannelItem = ({ item }: { item: any }) => {
    const typeColor = CHANNEL_TYPE_COLORS[item.type] || colors.primary;
    const hasUnread = (item.unreadCount || 0) > 0;

    // Get last message from channel or real-time update
    const lastMessage = item.lastMessage || {
      text: '',
      senderName: '',
      timestamp: '',
    };

    return (
      <TouchableOpacity
        style={[
          styles.channelItem,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          hasUnread && styles.channelItemUnread,
        ]}
        onPress={() => handleChannelPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: typeColor },
            ]}
          >
            {CHANNEL_TYPE_ICONS[item.type] || <MessageCircle size={16} color="#fff" />}
          </View>
          {/* Online indicator for direct messages */}
          {item.type === 'direct_message' && (
            <View style={[styles.onlineIndicator, { borderColor: colors.surface }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.channelContent}>
          <View style={styles.channelHeader}>
            <Text
              style={[
                styles.channelName,
                { color: colors.text },
                hasUnread && styles.channelNameUnread,
              ]}
              numberOfLines={1}
            >
              {item.name || 'Unnamed Channel'}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {formatTimestamp(lastMessage.timestamp)}
            </Text>
          </View>

          <View style={styles.channelMeta}>
            {lastMessage.text ? (
              <Text
                style={[
                  styles.lastMessage,
                  { color: hasUnread ? colors.text : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {lastMessage.senderName && (
                  <Text style={{ color: colors.textSecondary }}>
                    {lastMessage.senderName}:{' '}
                  </Text>
                )}
                {highlightMentions(lastMessage.text)}
              </Text>
            ) : (
              <Text style={[styles.noMessage, { color: colors.textMuted }]}>
                No messages yet
              </Text>
            )}

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}
              >
                <Text style={styles.unreadText}>
                  {(item.unreadCount || 0) > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}
          >
            <Text style={[styles.typeText, { color: typeColor }]}>
              {CHANNEL_TYPE_LABELS[item.type] || 'Chat'}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
        <MessageCircle size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No channels found' : 'No messages yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Start a conversation by creating a new channel'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={[styles.newChatButton, { backgroundColor: colors.primary }]}>
          <Plus size={20} color="#fff" />
          <Text style={styles.newChatText}>New Conversation</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    connectionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    connectionText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    newButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    broadcastButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    quickAccessContainer: {
      marginBottom: 8,
    },
    quickAccessTitle: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginHorizontal: 20,
      marginBottom: 8,
    },
    quickAccessScroll: {
      paddingHorizontal: 20,
      gap: 8,
    },
    quickAccessChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    quickAccessText: {
      fontSize: 13,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginHorizontal: 20,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      height: 48,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    listContainer: {
      paddingBottom: 100,
    },
    channelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    channelItemUnread: {
      backgroundColor: `${colors.primary}08`,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22c55e',
      borderWidth: 2,
    },
    channelContent: {
      flex: 1,
      marginLeft: 14,
      marginRight: 8,
    },
    channelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    channelName: {
      fontSize: 16,
      flex: 1,
      marginRight: 8,
    },
    channelNameUnread: {
      fontWeight: '700',
    },
    timestamp: {
      fontSize: 12,
    },
    channelMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lastMessage: {
      fontSize: 14,
      flex: 1,
      marginRight: 8,
    },
    noMessage: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    typeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 6,
    },
    typeText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    newChatText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    skeleton: {
      height: 80,
      marginHorizontal: 20,
      marginBottom: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Connection Status Badge */}
          <View
            style={[
              styles.connectionBadge,
              {
                backgroundColor: isConnected
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              },
            ]}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              }}
            />
            <Text
              style={[
                styles.connectionText,
                { color: isConnected ? '#22c55e' : '#ef4444' },
              ]}
            >
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>

          {/* Total Unread Badge */}
          {totalUnreadCount > 0 && (
            <View
              style={{
                backgroundColor: colors.error,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}

          {/* Admin Broadcast Button */}
          {isAdmin() && (
            <TouchableOpacity
              style={[styles.broadcastButton, { backgroundColor: colors.warning }]}
              onPress={handleBroadcast}
            >
              <Megaphone size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.newButton} onPress={handleCreateChannel}>
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Access Section for Teachers/Parents */}
      {(isTeacher() || isParent()) && (
        <View style={styles.quickAccessContainer}>
          <Text style={[styles.quickAccessTitle, { color: colors.textSecondary }]}>
            Quick Access
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAccessScroll}
          >
            {isTeacher() && (
              <>
                <TouchableOpacity style={[styles.quickAccessChip, { backgroundColor: `${colors.primary}15` }]}>
                  <Users size={16} color={colors.primary} />
                  <Text style={[styles.quickAccessText, { color: colors.primary }]}>Parent Channels</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickAccessChip, { backgroundColor: `${colors.success}15` }]}>
                  <GraduationCap size={16} color={colors.success} />
                  <Text style={[styles.quickAccessText, { color: colors.success }]}>Classroom</Text>
                </TouchableOpacity>
              </>
            )}
            {isParent() && (
              <>
                <TouchableOpacity style={[styles.quickAccessChip, { backgroundColor: `${colors.primary}15` }]}>
                  <Baby size={16} color={colors.primary} />
                  <Text style={[styles.quickAccessText, { color: colors.primary }]}>Child's Teachers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.quickAccessChip, { backgroundColor: `${colors.info}15` }]}>
                  <GraduationCap size={16} color={colors.info} />
                  <Text style={[styles.quickAccessText, { color: colors.info }]}>Class Updates</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* Channels List */}
      {isLoading ? (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { backgroundColor: colors.background }]}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          renderItem={renderChannelItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}
