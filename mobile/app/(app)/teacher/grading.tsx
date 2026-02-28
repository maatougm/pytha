import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  User,
  Clock,
  CheckCircle,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { RoleGuard } from '@/src/components/RoleGuard';
import { gradingService } from '@/src/services/grading.service';

type SubmissionStatus = 'pending' | 'graded' | 'late';

interface Submission {
  id: string;
  assignmentTitle: string;
  courseName: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  status: SubmissionStatus;
  points?: number;
  maxPoints: number;
  fileUrl?: string;
}

type FilterType = 'all' | 'pending' | 'graded' | 'late';

export default function TeacherGradingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isTeacher } = useRole();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradeInput, setGradeInput] = useState('');

  // Fetch assignments first, then get all submissions
  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => gradingService.getAssignments(),
  });

  // Flatten submissions from all assignments
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['teacher-submissions', assignments.map(a => a.id)],
    queryFn: async () => {
      const allSubmissions: Submission[] = [];
      for (const assignment of assignments) {
        try {
          const subs = await gradingService.getSubmissions(assignment.id);
          subs.forEach((sub: any) => {
            allSubmissions.push({
              id: sub.id,
              assignmentTitle: assignment.title || 'Untitled',
              courseName: assignment.classId || '',
              studentName: sub.student?.firstName
                ? `${sub.student.firstName} ${sub.student.lastName}`
                : sub.studentId,
              studentId: sub.studentId,
              submittedAt: sub.submittedAt || sub.createdAt,
              status: sub.grade ? 'graded' : (sub.isLate ? 'late' : 'pending'),
              points: sub.grade?.points,
              maxPoints: assignment.maxPoints || 100,
              fileUrl: sub.fileUrl,
            });
          });
        } catch {
          // Skip assignments we can't fetch submissions for
        }
      }
      return allSubmissions;
    },
    enabled: assignments.length > 0,
  });

  // Grade mutation
  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, points }: { submissionId: string; points: number }) =>
      gradingService.gradeSubmission(submissionId, { points, feedback: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredSubmissions = submissions.filter(submission => {
    if (activeFilter !== 'all' && submission.status !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        submission.assignmentTitle.toLowerCase().includes(query) ||
        submission.studentName.toLowerCase().includes(query) ||
        submission.courseName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const lateCount = submissions.filter(s => s.status === 'late').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return { bg: `${colors.warning}15`, text: colors.warning };
      case 'graded':
        return { bg: `${colors.success}15`, text: colors.success };
      case 'late':
        return { bg: `${colors.error}15`, text: colors.error };
      default:
        return { bg: colors.surface, text: colors.text };
    }
  };

  const getStatusLabel = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'graded':
        return 'Graded';
      case 'late':
        return 'Late';
      default:
        return status;
    }
  };

  const handleGradePress = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeInput(submission.points?.toString() || '');
    setGradeModalVisible(true);
  };

  const handleSubmitGrade = () => {
    if (selectedSubmission && gradeInput) {
      gradeMutation.mutate({
        submissionId: selectedSubmission.id,
        points: parseInt(gradeInput, 10),
      });
    }
    setGradeModalVisible(false);
    setSelectedSubmission(null);
  };

  const renderSubmissionCard = ({ item }: { item: Submission }) => {
    const statusStyle = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.submissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.assignmentTitle, { color: colors.text }]} numberOfLines={1}>
            {item.assignmentTitle}
          </Text>
          <Text style={[styles.courseName, { color: colors.textSecondary }]}>
            {item.courseName}
          </Text>

          {/* Student Info */}
          <View style={styles.studentRow}>
            <View style={[styles.avatar, { backgroundColor: colors.backgroundDark }]}>
              <User size={16} color={colors.textSecondary} />
            </View>
            <Text style={[styles.studentName, { color: colors.text }]}>
              {item.studentName}
            </Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {formatDate(item.submittedAt)}
              </Text>
            </View>
            {item.status === 'graded' && item.points !== undefined && (
              <View style={[styles.gradeBadge, { backgroundColor: `${colors.success}15` }]}>
                <Star size={14} color={colors.success} />
                <Text style={[styles.gradeText, { color: colors.success }]}>
                  {item.points}/{item.maxPoints}
                </Text>
              </View>
            )}
            {item.status !== 'graded' && (
              <Text style={[styles.pointsText, { color: colors.textMuted }]}>
                {item.maxPoints} pts
              </Text>
            )}
          </View>
        </View>

        {/* Action Button */}
        {item.status !== 'graded' ? (
          <TouchableOpacity
            style={[styles.gradeButton, { backgroundColor: colors.primary }]}
            onPress={() => handleGradePress(item)}
          >
            <Text style={styles.gradeButtonText}>Grade</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.gradedIndicator}>
            <CheckCircle size={24} color={colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (key: FilterType, label: string, count: number) => {
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
        <Text
          style={[
            styles.filterChipText,
            { color: isActive ? '#fff' : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : colors.backgroundDark },
          ]}
        >
          <Text
            style={[
              styles.countText,
              { color: isActive ? '#fff' : colors.textMuted },
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGradeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={gradeModalVisible}
      onRequestClose={() => setGradeModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Grade Assignment</Text>
          {selectedSubmission && (
            <>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {selectedSubmission.assignmentTitle}
              </Text>
              <Text style={[styles.modalStudent, { color: colors.textMuted }]}>
                Student: {selectedSubmission.studentName}
              </Text>

              <View style={styles.gradeInputContainer}>
                <Text style={[styles.gradeLabel, { color: colors.text }]}>Score</Text>
                <TextInput
                  style={[styles.gradeInput, {
                    backgroundColor: colors.backgroundDark,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  keyboardType="numeric"
                  value={gradeInput}
                  onChangeText={setGradeInput}
                  placeholder="Enter score"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.maxPoints, { color: colors.textMuted }]}>
                  / {selectedSubmission.maxPoints} points
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setGradeModalVisible(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleSubmitGrade}
                >
                  <Text style={styles.submitButtonText}>Submit Grade</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <RoleGuard allowedRoles={['teacher', 'admin']}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundDark }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>Grading Queue</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {pendingCount} pending to grade
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search submissions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {renderFilterChip('all', 'All', submissions.length)}
          {renderFilterChip('pending', 'Pending', pendingCount)}
          {renderFilterChip('graded', 'Graded', gradedCount)}
          {renderFilterChip('late', 'Late', lateCount)}
        </View>

        {/* Submissions List */}
        <FlatList
          data={filteredSubmissions}
          renderItem={renderSubmissionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No submissions found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {activeFilter === 'pending'
                  ? 'All caught up! No pending submissions.'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          }
        />

        {/* Grade Modal */}
        {renderGradeModal()}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
  submissionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    marginBottom: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    marginLeft: 6,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 13,
  },
  gradeButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  gradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gradedIndicator: {
    marginTop: 12,
    alignItems: 'center',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  modalStudent: {
    fontSize: 14,
    marginBottom: 24,
  },
  gradeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  gradeInput: {
    width: 100,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  maxPoints: {
    fontSize: 16,
    marginLeft: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {},
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
