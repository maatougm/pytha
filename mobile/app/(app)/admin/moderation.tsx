import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  VolumeX,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { RoleGuard } from '@/src/components/RoleGuard';
import { adminService } from '@/src/services/admin.service';

type ReportStatus = 'pending' | 'resolved' | 'dismissed';
type ReportType = 'inappropriate' | 'spam' | 'harassment' | 'cheating' | 'other';

interface ModerationReport {
  id: string;
  type: ReportType;
  status: ReportStatus;
  reportedContent: string;
  contentType: 'message' | 'channel';
  reporterName: string;
  reportedUserName: string;
  reason: string;
  timestamp: string;
  channelName?: string;
  priority: 'low' | 'medium' | 'high';
  actionsTaken?: string[];
}

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; color: string; icon: React.ReactNode }> = {
  inappropriate: {
    label: 'Inappropriate',
    color: '#f59e0b',
    icon: <AlertTriangle size={16} color="#fff" />,
  },
  spam: {
    label: 'Spam',
    color: '#6b7280',
    icon: <MessageSquare size={16} color="#fff" />,
  },
  harassment: {
    label: 'Harassment',
    color: '#dc2626',
    icon: <User size={16} color="#fff" />,
  },
  cheating: {
    label: 'Cheating',
    color: '#7c3aed',
    icon: <Eye size={16} color="#fff" />,
  },
  other: {
    label: 'Other',
    color: '#0891b2',
    icon: <Shield size={16} color="#fff" />,
  },
};

type FilterStatus = 'all' | 'pending' | 'resolved' | 'dismissed';

export default function AdminModerationScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('pending');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch moderation queue from backend
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: () => adminService.getModerationQueue(),
  });

  // Map backend items to our display type
  const reports: ModerationReport[] = (queueData?.data || []).map((item: any) => ({
    id: item.id,
    type: item.type || 'other',
    status: item.status || 'pending',
    reportedContent: item.reportedContent || item.content || '',
    contentType: item.contentType || 'message',
    reporterName: item.reporterName || item.reporter?.name || 'Unknown',
    reportedUserName: item.reportedUserName || item.reportedUser?.name || 'Unknown',
    reason: item.reason || '',
    timestamp: item.createdAt || item.timestamp || '',
    channelName: item.channelName,
    priority: item.priority || 'medium',
    actionsTaken: item.actionsTaken || [],
  }));

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (reportId: string) => adminService.moderateContent(reportId, { action: 'resolve' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation-queue'] }),
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (reportId: string) => adminService.moderateContent(reportId, { action: 'dismiss' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation-queue'] }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredReports = reports.filter((report) => {
    if (activeFilter === 'all') return true;
    return report.status === activeFilter;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getPriorityColor = (priority: ModerationReport['priority']) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'resolved':
        return colors.success;
      case 'dismissed':
        return colors.textMuted;
    }
  };

  const handleResolve = (report: ModerationReport) => {
    Alert.alert(
      'Resolve Report',
      'Mark this report as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            console.log('Resolving report:', report.id);
            setDetailModalVisible(false);
          },
        },
      ]
    );
  };

  const handleDismiss = (report: ModerationReport) => {
    Alert.alert(
      'Dismiss Report',
      'Dismiss this report without action?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            console.log('Dismissing report:', report.id);
            setDetailModalVisible(false);
          },
        },
      ]
    );
  };

  const handleMuteUser = (report: ModerationReport) => {
    Alert.alert(
      'Mute User',
      `Mute ${report.reportedUserName} for 24 hours?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          onPress: () => {
            console.log('Muting user:', report.reportedUserName);
          },
        },
      ]
    );
  };

  const handleDeleteContent = (report: ModerationReport) => {
    Alert.alert(
      'Delete Content',
      'Delete the reported content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting content for report:', report.id);
          },
        },
      ]
    );
  };

  const renderReportCard = ({ item }: { item: ModerationReport }) => {
    const typeConfig = REPORT_TYPE_CONFIG[item.type];
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          setSelectedReport(item);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {/* Header with type and priority */}
        <View style={styles.reportHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
            {typeConfig.icon}
            <Text style={styles.typeText}>{typeConfig.label}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        {/* Reported Content Preview */}
        <Text style={[styles.contentPreview, { color: colors.text }]} numberOfLines={2}>
          "{item.reportedContent}"
        </Text>

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <User size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Reported: {item.reportedUserName}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>

        {item.channelName && (
          <View style={styles.channelTag}>
            <MessageSquare size={12} color={colors.textMuted} />
            <Text style={[styles.channelText, { color: colors.textMuted }]}>
              {item.channelName}
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        <ChevronRight size={20} color={colors.textMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (key: FilterStatus, label: string, count: number) => {
    const isActive = activeFilter === key;
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setActiveFilter(key)}
      >
        <Text style={[styles.filterChipText, { color: isActive ? '#fff' : colors.textSecondary }]}>
          {label}
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.backgroundDark },
          ]}
        >
          <Text style={[styles.countText, { color: isActive ? '#fff' : colors.textMuted }]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedReport) return null;
    const typeConfig = REPORT_TYPE_CONFIG[selectedReport.type];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalTypeBadge, { backgroundColor: typeConfig.color }]}>
                {typeConfig.icon}
                <Text style={styles.modalTypeText}>{typeConfig.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <XCircle size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Reported Content */}
            <View style={styles.contentSection}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Reported Content</Text>
              <View style={[styles.contentBox, { backgroundColor: colors.backgroundDark }]}>
                <Text style={[styles.contentText, { color: colors.text }]}>
                  "{selectedReport.reportedContent}"
                </Text>
              </View>
            </View>

            {/* Reporter Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reported By</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{selectedReport.reporterName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reported User</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {selectedReport.reportedUserName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reason</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{selectedReport.reason}</Text>
              </View>
              {selectedReport.channelName && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Channel</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {selectedReport.channelName}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions Taken */}
            {selectedReport.actionsTaken && selectedReport.actionsTaken.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Actions Taken</Text>
                {selectedReport.actionsTaken.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.text }]}>{action}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            {selectedReport.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.muteBtn, { borderColor: colors.border }]}
                  onPress={() => handleMuteUser(selectedReport)}
                >
                  <VolumeX size={18} color={colors.warning} />
                  <Text style={[styles.muteBtnText, { color: colors.warning }]}>Mute User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn, { borderColor: colors.border }]}
                  onPress={() => handleDeleteContent(selectedReport)}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.dismissBtn, { borderColor: colors.border }]}
                  onPress={() => handleDismiss(selectedReport)}
                >
                  <XCircle size={18} color={colors.textMuted} />
                  <Text style={[styles.dismissBtnText, { color: colors.textMuted }]}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.resolveBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleResolve(selectedReport)}
                >
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.resolveBtnText}>Resolve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundDark }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>Moderation Queue</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {pendingCount} pending reports
            </Text>
          </View>
          <View style={[styles.shieldBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Shield size={20} color={colors.primary} />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {renderFilterChip('all', 'All', reports.length)}
          {renderFilterChip('pending', 'Pending', pendingCount)}
          {renderFilterChip('resolved', 'Resolved', resolvedCount)}
          {renderFilterChip('dismissed', 'Dismissed', dismissedCount)}
        </View>

        {/* Reports List */}
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={48} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No {activeFilter === 'all' ? '' : activeFilter} reports
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                All reports have been handled
              </Text>
            </View>
          }
        />

        {/* Detail Modal */}
        {renderDetailModal()}
      </SafeAreaView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contentPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  channelText: {
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  modalTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contentBox: {
    padding: 16,
    borderRadius: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    minWidth: '23%',
  },
  muteBtn: {},
  muteBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {},
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissBtn: {},
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolveBtn: {
    borderWidth: 0,
  },
  resolveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
