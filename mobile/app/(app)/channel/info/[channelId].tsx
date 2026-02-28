import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Bell,
  Pin,
  Image as ImageIcon,
  FileText,
  AlertTriangle,
  LogOut,
  Trash2,
  ChevronRight,
  MessageSquare,
  Search,
  MoreVertical,
  Crown,
  Shield,
  GraduationCap,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';

interface ChannelInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  memberCount: number;
  isMuted: boolean;
  isPinned: boolean;
  avatar?: string;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'moderator';
  isOnline: boolean;
  joinedAt: string;
}

interface SharedMedia {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  sentAt: string;
}

const fetchChannelInfo = async (channelId: string): Promise<ChannelInfo> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    id: channelId,
    name: 'Mathematics 101',
    type: 'classroom',
    description: 'Classroom channel for Advanced Mathematics course. Share questions, resources, and collaborate with classmates.',
    createdAt: '2026-01-15',
    memberCount: 28,
    isMuted: false,
    isPinned: true,
  };
};

const fetchMembers = async (channelId: string): Promise<Member[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return [
    { id: '1', name: 'Dr. Sarah Chen', role: 'teacher', isOnline: true, joinedAt: '2026-01-15' },
    { id: '2', name: 'Alex Johnson', role: 'student', isOnline: true, joinedAt: '2026-01-16' },
    { id: '3', name: 'Maria Garcia', role: 'student', isOnline: false, joinedAt: '2026-01-16' },
    { id: '4', name: 'James Wilson', role: 'student', isOnline: true, joinedAt: '2026-01-17' },
    { id: '5', name: 'Emma Brown', role: 'student', isOnline: false, joinedAt: '2026-01-18' },
    { id: '6', name: 'Michael Chen', role: 'student', isOnline: true, joinedAt: '2026-01-18' },
    { id: '7', name: 'Sophie Davis', role: 'student', isOnline: false, joinedAt: '2026-01-19' },
    { id: '8', name: 'William Taylor', role: 'student', isOnline: false, joinedAt: '2026-01-20' },
  ];
};

const fetchSharedMedia = async (channelId: string): Promise<SharedMedia[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: '1', type: 'image', url: '#', name: 'solution.jpg', sentAt: '2026-02-25' },
    { id: '2', type: 'file', url: '#', name: 'Homework_Solutions.pdf', sentAt: '2026-02-24' },
    { id: '3', type: 'image', url: '#', name: 'diagram.png', sentAt: '2026-02-23' },
    { id: '4', type: 'file', url: '#', name: 'Study_Guide.docx', sentAt: '2026-02-22' },
    { id: '5', type: 'image', url: '#', name: 'class_photo.jpg', sentAt: '2026-02-20' },
    { id: '6', type: 'file', url: '#', name: 'Formula_Sheet.pdf', sentAt: '2026-02-18' },
  ];
};

const CHANNEL_TYPE_ICONS: Record<string, React.ReactNode> = {
  classroom: <GraduationCap size={40} color="#fff" />,
  direct_message: <User size={40} color="#fff" />,
  teacher_parent: <Users size={40} color="#fff" />,
  admin_broadcast: <Shield size={40} color="#fff" />,
  group: <MessageSquare size={40} color="#fff" />,
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Crown size={14} color="#f59e0b" />,
  teacher: <GraduationCap size={14} color="#3b82f6" />,
  moderator: <Shield size={14} color="#8b5cf6" />,
  parent: <Users size={14} color="#10b981" />,
  student: <User size={14} color="#6b7280" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#f59e0b',
  teacher: '#3b82f6',
  moderator: '#8b5cf6',
  parent: '#10b981',
  student: '#6b7280',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  moderator: 'Mod',
  parent: 'Parent',
  student: 'Student',
};

export default function ChannelInfoScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllMembers, setShowAllMembers] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const { data: channel } = useQuery({
    queryKey: ['channel-info', channelId],
    queryFn: () => fetchChannelInfo(channelId),
  });

  const { data: members } = useQuery({
    queryKey: ['channel-members', channelId],
    queryFn: () => fetchMembers(channelId),
  });

  const { data: sharedMedia } = useQuery({
    queryKey: ['channel-media', channelId],
    queryFn: () => fetchSharedMedia(channelId),
  });

  const filteredMembers = members?.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedMembers = showAllMembers ? filteredMembers : filteredMembers?.slice(0, 5);

  const handleLeaveChannel = () => {
    Alert.alert(
      'Leave Channel',
      `Are you sure you want to leave "${channel?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)/messages');
          }
        },
      ]
    );
  };

  const handleDeleteChannel = () => {
    Alert.alert(
      'Delete Channel',
      `Are you sure you want to delete "${channel?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            router.replace('/(tabs)/messages');
          }
        },
      ]
    );
  };

  const handleReportChannel = () => {
    Alert.alert(
      'Report Channel',
      'Please select a reason for reporting this channel:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Other', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
      ]
    );
  };

  const handleMemberPress = (member: Member) => {
    if (isAdmin || isTeacher) {
      setSelectedMember(member);
      setShowMemberMenu(true);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginRight: 40,
    },
    content: {
      flex: 1,
    },
    // Channel Header Section
    channelHeader: {
      backgroundColor: colors.background,
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    channelName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    channelType: {
      fontSize: 14,
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    memberCount: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    // Actions Section
    actionsSection: {
      backgroundColor: colors.background,
      marginTop: 12,
      paddingVertical: 8,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.backgroundDark,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    actionText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    actionValue: {
      fontSize: 14,
      color: colors.textMuted,
      marginRight: 8,
    },
    // Members Section
    section: {
      backgroundColor: colors.background,
      marginTop: 12,
      paddingVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    sectionCount: {
      fontSize: 15,
      color: colors.textMuted,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundDark,
      borderRadius: 10,
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 12,
      height: 40,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      marginLeft: 8,
    },
    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    memberAvatarContainer: {
      position: 'relative',
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberInitials: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22c55e',
      borderWidth: 2,
      borderColor: colors.background,
    },
    memberInfo: {
      flex: 1,
      marginLeft: 12,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    viewAllText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '500',
    },
    // Media Grid
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 8,
    },
    mediaItem: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: colors.backgroundDark,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    viewMoreMedia: {
      backgroundColor: colors.primary,
    },
    viewMoreText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    // Danger Zone
    dangerSection: {
      backgroundColor: colors.background,
      marginTop: 12,
      marginBottom: 32,
      paddingVertical: 8,
    },
    dangerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    dangerIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${colors.error}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    dangerText: {
      flex: 1,
      fontSize: 16,
      color: colors.error,
    },
    deleteText: {
      fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 20,
    },
    modalHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    modalRole: {
      fontSize: 14,
      color: colors.textMuted,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemIcon: {
      marginRight: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
    },
    menuItemDanger: {
      color: colors.error,
    },
    menuCancel: {
      marginTop: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    menuCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel Info</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Channel Header */}
        <View style={styles.channelHeader}>
          <View style={styles.avatarContainer}>
            {CHANNEL_TYPE_ICONS[channel?.type || 'group']}
          </View>
          <Text style={styles.channelName}>{channel?.name}</Text>
          <Text style={styles.channelType}>{channel?.type.replace('_', ' ')} Channel</Text>
          <Text style={styles.memberCount}>{channel?.memberCount} members</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Bell size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Mute Notifications</Text>
            <Switch
              value={isMuted}
              onValueChange={setIsMuted}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Pin size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Pin Channel</Text>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <ImageIcon size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Change Avatar</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <FileText size={18} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Description</Text>
            <Text style={styles.actionValue} numberOfLines={1}>Edit</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.sectionCount}>{members?.length || 0}</Text>
          </View>

          <View style={styles.searchContainer}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {displayedMembers?.map((member) => (
            <TouchableOpacity 
              key={member.id} 
              style={styles.memberItem}
              onPress={() => handleMemberPress(member)}
            >
              <View style={styles.memberAvatarContainer}>
                <View style={[styles.memberAvatar, { backgroundColor: ROLE_COLORS[member.role] }]}>
                  <Text style={styles.memberInitials}>{member.name.charAt(0)}</Text>
                </View>
                {member.isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={styles.roleBadge}>
                  {ROLE_ICONS[member.role]}
                  <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
                    {ROLE_LABELS[member.role]}
                  </Text>
                </View>
              </View>
              {(isAdmin || isTeacher) && member.role !== 'admin' && (
                <MoreVertical size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}

          {filteredMembers && filteredMembers.length > 5 && !showAllMembers && (
            <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowAllMembers(true)}>
              <Text style={styles.viewAllText}>View All Members</Text>
              <ChevronRight size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Shared Media */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shared Media</Text>
            <Text style={styles.sectionCount}>{sharedMedia?.length || 0}</Text>
          </View>

          <View style={styles.mediaGrid}>
            {sharedMedia?.slice(0, 5).map((media, index) => (
              <TouchableOpacity key={media.id} style={styles.mediaItem}>
                {media.type === 'image' ? (
                  <ImageIcon size={24} color={colors.textMuted} />
                ) : (
                  <FileText size={24} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            ))}
            {(sharedMedia?.length || 0) > 5 && (
              <TouchableOpacity style={[styles.mediaItem, styles.viewMoreMedia]}>
                <Text style={styles.viewMoreText}>+{sharedMedia!.length - 5}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleReportChannel}>
            <View style={styles.dangerIcon}>
              <AlertTriangle size={18} color={colors.error} />
            </View>
            <Text style={styles.dangerText}>Report Channel</Text>
            <ChevronRight size={20} color={colors.error} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerItem} onPress={handleLeaveChannel}>
            <View style={styles.dangerIcon}>
              <LogOut size={18} color={colors.error} />
            </View>
            <Text style={[styles.dangerText, styles.deleteText]}>Leave Channel</Text>
            <ChevronRight size={20} color={colors.error} />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteChannel}>
              <View style={styles.dangerIcon}>
                <Trash2 size={18} color={colors.error} />
              </View>
              <Text style={[styles.dangerText, styles.deleteText]}>Delete Channel</Text>
              <ChevronRight size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Member Menu Modal */}
      <Modal
        visible={showMemberMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberMenu(false)}
        >
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.memberInitials}>{selectedMember.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.modalName}>{selectedMember.name}</Text>
                  <Text style={styles.modalRole}>{ROLE_LABELS[selectedMember.role]}</Text>
                </View>

                <TouchableOpacity style={styles.menuItem}>
                  <MessageSquare size={20} color={colors.text} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Send Message</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Shield size={20} color={colors.text} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Make Moderator</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Users size={20} color={colors.text} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <LogOut size={20} color={colors.error} style={styles.menuItemIcon} />
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>Remove from Channel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuCancel} onPress={() => setShowMemberMenu(false)}>
                  <Text style={styles.menuCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
