import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  Plus,
  Users,
  Baby,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { useAssignments } from '@/src/hooks/useAssignments';
import type { Assignment } from '@/src/types/api';
import { router } from 'expo-router';

type FilterTab = 'all' | 'pending' | 'submitted' | 'graded' | 'late';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'graded', label: 'Graded' },
  { key: 'late', label: 'Late' },
];

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: <Clock size={14} color="#3b82f6" />,
    label: 'Pending',
  },
  submitted: {
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: <CheckCircle size={14} color="#10b981" />,
    label: 'Submitted',
  },
  graded: {
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: <FileText size={14} color="#8b5cf6" />,
    label: 'Graded',
  },
  late: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: <AlertTriangle size={14} color="#ef4444" />,
    label: 'Late',
  },
};

export default function AssignmentsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isTeacher, isParent, isStudent } = useRole();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: assignments, isLoading, refetch } = useAssignments(activeFilter === 'all' ? undefined : { status: activeFilter });

  // Get appropriate filters based on role
  const getFilterTabs = (): { key: FilterTab; label: string }[] => {
    if (isTeacher()) {
      return [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'To Grade' },
        { key: 'submitted', label: 'Submitted' },
        { key: 'graded', label: 'Graded' },
      ];
    }
    if (isParent()) {
      return [
        { key: 'all', label: "Child's Work" },
        { key: 'pending', label: 'Pending' },
        { key: 'graded', label: 'Graded' },
        { key: 'late', label: 'Late' },
      ];
    }
    // Student default
    return FILTER_TABS;
  };

  const FILTER_TABS_FOR_ROLE = getFilterTabs();

  const handleCreateAssignment = () => {
    router.push('/(app)/assignment/create');
  };

  const handleViewSubmissions = (assignmentId: string) => {
    router.push(`/(app)/assignment/${assignmentId}/submissions`);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffDays < 0) {
      return { text: 'Overdue', isUrgent: true, color: colors.error };
    }
    if (diffDays === 0) {
      if (diffHours <= 0) {
        return { text: 'Due now', isUrgent: true, color: colors.error };
      }
      return { text: `Due in ${diffHours} hours`, isUrgent: true, color: colors.warning };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isUrgent: true, color: colors.warning };
    }
    if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, isUrgent: false, color: colors.warning };
    }
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isUrgent: false, color: colors.textSecondary };
  };

  const renderFilterTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
      <FlatList
        data={FILTER_TABS_FOR_ROLE}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveFilter(item.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      />
    </View>
  );

  const renderAssignmentCard = ({ item }: { item: Assignment }) => {
    const status = STATUS_CONFIG[item.status || 'pending'];
    const dueInfo = formatDueDate(item.dueDate || '');
    const isGraded = item.status === 'graded' && item.earnedPoints !== undefined;
    const hasSubmissions = (item.submissionCount ?? 0) > 0;

    return (
      <TouchableOpacity
        style={[
          styles.assignmentCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          item.status === 'late' && styles.lateCard,
        ]}
        onPress={() => router.push(`/(app)/assignment/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Status Indicator Bar */}
        <View style={[styles.statusBar, { backgroundColor: status.color }]} />

        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
              {status.icon}
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            {isGraded && (
              <View style={[styles.gradeBadge, { backgroundColor: `${colors.success}15` }]}>
                <Text style={[styles.gradeText, { color: colors.success }]}>
                  {item.earnedPoints}/{item.points} pts
                </Text>
              </View>
            )}
          </View>

          {/* Title & Course */}
          <Text style={[styles.assignmentTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.courseName, { color: colors.textSecondary }]}>
            {item.courseName}
          </Text>

          {/* Due Date */}
          <View style={styles.dueContainer}>
            <Calendar size={14} color={dueInfo.color} />
            <Text style={[styles.dueText, { color: dueInfo.color }]}>
              {dueInfo.text}
            </Text>
            {dueInfo.isUrgent && item.status !== 'late' && (
              <View style={[styles.urgentBadge, { backgroundColor: `${colors.warning}20` }]}>
                <AlertCircle size={12} color={colors.warning} />
                <Text style={[styles.urgentText, { color: colors.warning }]}>Due Soon</Text>
              </View>
            )}
          </View>

          {/* Action */}
          <View style={styles.actionRow}>
            <Text style={[styles.pointsText, { color: colors.textMuted }]}>
              {item.points} points
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
          
          {/* Teacher-specific: Submission count & grade button */}
          {isTeacher() && (
            <View style={[styles.teacherActions, { borderTopColor: colors.border }]}>
              <View style={styles.submissionInfo}>
                <Users size={14} color={colors.textMuted} />
                <Text style={[styles.submissionText, { color: colors.textMuted }]}>
                  {item.submissionCount ?? 0} submissions
                </Text>
              </View>
              {hasSubmissions && (
                <TouchableOpacity
                  style={[styles.gradeButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleViewSubmissions(item.id)}
                >
                  <Text style={styles.gradeButtonText}>Grade</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Parent-specific: Child info */}
          {isParent() && item.studentName && (
            <View style={[styles.parentInfo, { borderTopColor: colors.border }]}>
              <Baby size={14} color={colors.textMuted} />
              <Text style={[styles.parentInfoText, { color: colors.textMuted }]}>
                {item.studentName}'s assignment
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const getEmptyMessage = (key: FilterTab): string => {
      if (isTeacher()) {
        const messages: Record<FilterTab, string> = {
          all: 'No assignments found',
          pending: 'No assignments to grade',
          submitted: 'No submissions yet',
          graded: 'No graded assignments',
          late: 'No late submissions',
        };
        return messages[key];
      }
      if (isParent()) {
        const messages: Record<FilterTab, string> = {
          all: "No child's assignments found",
          pending: 'No pending assignments',
          submitted: 'No submitted assignments',
          graded: 'No graded assignments yet',
          late: 'No late assignments',
        };
        return messages[key];
      }
      const messages: Record<FilterTab, string> = {
        all: 'No assignments found',
        pending: 'No pending assignments',
        submitted: 'No submitted assignments',
        graded: 'No graded assignments yet',
        late: 'No late assignments',
      };
      return messages[key];
    };

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
          <FileText size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {getEmptyMessage(activeFilter)}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {activeFilter === 'all'
            ? 'Enjoy your free time!'
            : 'Switch to "All" to see all assignments'}
        </Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabsContainer: {
      borderBottomWidth: 1,
    },
    tabsContent: {
      paddingHorizontal: 16,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      position: 'relative',
    },
    tabActive: {
      // Active styling
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    tabTextActive: {
      fontWeight: '600',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 16,
      right: 16,
      height: 2,
      borderRadius: 1,
    },
    listContainer: {
      padding: 20,
      paddingTop: 8,
      paddingBottom: 100,
    },
    assignmentCard: {
      flexDirection: 'row',
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
      overflow: 'hidden',
    },
    lateCard: {
      borderColor: colors.error,
      backgroundColor: `${colors.error}05`,
    },
    statusBar: {
      width: 4,
    },
    cardContent: {
      flex: 1,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    gradeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    gradeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    assignmentTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      lineHeight: 22,
    },
    courseName: {
      fontSize: 14,
      marginBottom: 12,
    },
    dueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    dueText: {
      fontSize: 13,
      fontWeight: '500',
    },
    urgentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
      marginLeft: 8,
    },
    urgentText: {
      fontSize: 11,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pointsText: {
      fontSize: 13,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    skeleton: {
      height: 160,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    createButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    teacherActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    submissionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    submissionText: {
      fontSize: 13,
    },
    gradeButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
    },
    gradeButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    parentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    parentInfoText: {
      fontSize: 13,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {isTeacher() ? 'Assignments & Grading' : isParent() ? "Child's Assignments" : 'Assignments'}
          </Text>
          <View style={styles.headerActions}>
            {isTeacher() && (
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAssignment}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.filterButton, { marginLeft: 8 }]}>
              <Filter size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Assignments List */}
      {isLoading ? (
        <View style={{ marginTop: 20 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { backgroundColor: colors.background }]}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentCard}
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
