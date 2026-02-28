/**
 * Chat Screen
 *
 * Real-time chat interface with WebSocket integration.
 * Features:
 * - Real-time message sending and receiving
 * - Typing indicators
 * - Message reactions
 * - Read receipts
 * - Message editing and deletion
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Send,
  ChevronLeft,
  MoreVertical,
  Smile,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useChat } from '@/src/hooks/useChat';
import { useSocketContext } from '@/src/providers/SocketProvider';

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  }>;
  readReceipts?: Array<{
    userId: string;
    readAt: string;
  }>;
  isOptimistic?: boolean;
  error?: string;
}

interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string;
}

// ============================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  showAvatar?: boolean;
}

function MessageBubble({
  message,
  isOwn,
  onReaction,
  onEdit,
  onDelete,
  showAvatar,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
    setShowActions(false);
  };

  const handleDelete = () => {
    onDelete(message.id);
    setShowActions(false);
  };

  const isDeleted = message.isDeleted;
  const hasReactions = message.reactions && message.reactions.length > 0;
  const readCount = message.readReceipts?.length || 0;

  // Group reactions by emoji
  const reactionGroups = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  if (isDeleted) {
    return (
      <View style={[styles.bubbleContainer, isOwn ? styles.ownContainer : styles.otherContainer]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.surface,
              opacity: 0.6,
            },
          ]}
        >
          <Text style={[styles.deletedText, { color: colors.textMuted }]}>
            Message deleted
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleContainer, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {/* Avatar for other users */}
      {!isOwn && showAvatar && (
        <View style={styles.avatar}>
          {message.sender?.avatarUrl ? (
            <Image source={{ uri: message.sender.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {message.sender?.firstName?.[0]}
                {message.sender?.lastName?.[0]}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        onLongPress={() => !isEditing && setShowActions(true)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwn ? colors.primary : colors.surface,
              opacity: message.isOptimistic ? 0.7 : 1,
            },
          ]}
        >
          {isEditing ? (
            <View>
              <TextInput
                style={[
                  styles.editInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={editContent}
                onChangeText={setEditContent}
                autoFocus
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit}>
                  <Check size={18} color={colors.success || '#22c55e'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  { color: isOwn ? '#fff' : colors.text },
                ]}
              >
                {message.content}
              </Text>

              {/* Edited indicator */}
              {message.isEdited && (
                <Text style={[styles.editedText, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                  edited
                </Text>
              )}

              {/* Timestamp and read status */}
              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.timestamp,
                    { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}
                >
                  {formatTime(message.createdAt)}
                </Text>
                {isOwn && (
                  <View style={styles.readStatus}>
                    {readCount > 0 ? (
                      <CheckCheck size={14} color={isOwn ? '#fff' : colors.primary} />
                    ) : (
                      <Check size={14} color={isOwn ? 'rgba(255,255,255,0.5)' : colors.textMuted} />
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          {/* Reactions */}
          {hasReactions && !isEditing && (
            <View style={styles.reactionsContainer}>
              {Object.entries(reactionGroups || {}).map(([emoji, reactions]) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionBadge,
                    { backgroundColor: colors.background },
                    reactions.some((r) => r.userId === message.senderId) && styles.reactionActive,
                  ]}
                  onPress={() => onReaction(message.id, emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={[styles.reactionCount, { color: colors.text }]}>
                    {reactions.length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action menu */}
        {showActions && (
          <View style={[styles.actionMenu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onReaction(message.id, '👍');
                setShowActions(false);
              }}
            >
              <Text style={styles.actionEmoji}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onReaction(message.id, '❤️');
                setShowActions(false);
              }}
            >
              <Text style={styles.actionEmoji}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onReaction(message.id, '😂');
                setShowActions(false);
              }}
            >
              <Text style={styles.actionEmoji}>😂</Text>
            </TouchableOpacity>
            {isOwn && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    setIsEditing(true);
                    setShowActions(false);
                  }}
                >
                  <Edit2 size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.actionItem} onPress={() => setShowActions(false)}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// TYPING INDICATOR COMPONENT
// ============================================================

interface TypingIndicatorProps {
  users: TypingUser[];
}

function TypingIndicator({ users }: TypingIndicatorProps) {
  const { colors } = useTheme();

  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].name} is typing...`
      : users.length === 2
      ? `${users[0].name} and ${users[1].name} are typing...`
      : `${users[0].name} and ${users.length - 1} others are typing...`;

  return (
    <View style={[styles.typingContainer, { backgroundColor: colors.background }]}>
      <View style={styles.typingDots}>
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.typingText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

// ============================================================
// MAIN SCREEN COMPONENT
// ============================================================

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { subscribeToChannel, unsubscribeFromChannel } = useSocketContext();

  const [inputText, setInputText] = useState('');
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Initialize chat hook
  const {
    messages,
    isLoading,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    startTyping,
    stopTyping,
  } = useChat({ channelId });

  // Subscribe to channel on mount
  React.useEffect(() => {
    if (channelId) {
      subscribeToChannel(channelId);
      return () => {
        unsubscribeFromChannel(channelId);
      };
    }
  }, [channelId, subscribeToChannel, unsubscribeFromChannel]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    sendMessage(inputText.trim());
    setInputText('');
    stopTyping();
  }, [inputText, sendMessage, stopTyping]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isOwn = item.senderId === user?.id;
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showAvatar = !isOwn && prevMessage?.senderId !== item.senderId;

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          onReaction={addReaction}
          onEdit={editMessage}
          onDelete={deleteMessage}
          showAvatar={showAvatar}
        />
      );
    },
    [user?.id, messages, addReaction, editMessage, deleteMessage]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Channel</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {typingUsers.length > 0 ? 'typing...' : 'online'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
          >
            <Smile size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.background },
            ]}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.primary : colors.textMuted },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 16,
  },
  bubbleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  editedText: {
    fontSize: 10,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  readStatus: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  reactionActive: {
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionMenu: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    flexDirection: 'row',
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 4,
    gap: 8,
  },
  actionItem: {
    padding: 6,
  },
  actionEmoji: {
    fontSize: 18,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  editInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minWidth: 200,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  emojiButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
