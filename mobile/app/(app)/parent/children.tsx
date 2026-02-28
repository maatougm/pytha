import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  TrendingUp,
  Calendar,
  FileText,
  MessageSquare,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { RoleGuard } from '@/src/components/RoleGuard';
import { useChildren } from '@/src/hooks/useProfile';

// Types for child display data
type GradeSummary = {
  subject: string;
  currentGrade: string;
  trend: 'up' | 'down' | 'stable';
};

type AttendanceStatus = 'present' | 'absent' | 'late';

type AssignmentSummary = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
};

interface Child {
  id: string;
  name: string;
  grade: string;
  schoolId: string;
  avatar?: string;
  gpa: number;
  attendanceRate: number;
  recentGrades: GradeSummary[];
  attendance: { date: string; status: AttendanceStatus }[];
  upcomingAssignments: AssignmentSummary[];
  teachers: { name: string; subject: string }[];
}

export default function ParentChildrenScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isParent } = useRole();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch children from the real API
  const { data: rawChildren = [], isLoading, refetch } = useChildren();

  // Map backend children to display format
  const children: Child[] = rawChildren.map((child: any) => ({
    id: child.id,
    name: child.firstName ? `${child.firstName} ${child.lastName || ''}`.trim() : child.name || 'Unknown',
    grade: child.grade || child.className || '',
    schoolId: child.schoolId || child.id,
    avatar: child.avatar,
    gpa: child.gpa || 0,
    attendanceRate: child.attendanceRate || 0,
    recentGrades: child.recentGrades || [],
    attendance: child.attendance || [],
    upcomingAssignments: child.upcomingAssignments || [],
    teachers: child.teachers || [],
  }));

  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // Auto-select first child when data loads
  const currentChild = selectedChild || children[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getTrendIcon = (trend: GradeSummary['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color={colors.success} />;
      case 'down':
        return <TrendingUp size={16} color={colors.error} style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return <TrendingUp size={16} color={colors.textMuted} />;
    }
  };

  const getAttendanceIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={14} color={colors.success} />;
      case 'absent':
        return <AlertCircle size={14} color={colors.error} />;
      case 'late':
        return <Clock size={14} color={colors.warning} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const handleMessageTeacher = (teacherName: string) => {
    // Navigate to message teacher
    router.push(`/(app)/chat/new?recipient=${teacherName}`);
  };

  const renderChildSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.childSelector}
    >
      {children.map((child) => (
        <TouchableOpacity
          key={child.id}
          style={[
            styles.childChip,
            {
              backgroundColor: currentChild.id === child.id ? colors.primary : colors.surface,
              borderColor: currentChild.id === child.id ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelectedChild(child)}
        >
          <View
            style={[
              styles.childAvatar,
              {
                backgroundColor:
                  currentChild.id === child.id ? 'rgba(255,255,255,0.3)' : colors.backgroundDark,
              },
            ]}
          >
            <User size={20} color={currentChild.id === child.id ? '#fff' : colors.textSecondary} />
          </View>
          <View>
            <Text
              style={[
                styles.childName,
                { color: currentChild.id === child.id ? '#fff' : colors.text },
              ]}
            >
              {child.name}
            </Text>
            <Text
              style={[
                styles.childGrade,
                { color: currentChild.id === child.id ? 'rgba(255,255,255,0.8)' : colors.textMuted },
              ]}
            >
              {child.grade}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverviewCards = () => (
    <View style={styles.overviewContainer}>
      <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Star size={20} color={colors.primary} />
        </View>
        <Text style={[styles.overviewValue, { color: colors.text }]}>{currentChild.gpa.toFixed(1)}</Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>GPA</Text>
      </View>

      <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.overviewIcon, { backgroundColor: `${colors.success}15` }]}>
          <Calendar size={20} color={colors.success} />
        </View>
        <Text style={[styles.overviewValue, { color: colors.text }]}>
          {currentChild.attendanceRate}%
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Attendance</Text>
      </View>

      <View style={[styles.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.overviewIcon, { backgroundColor: `${colors.warning}15` }]}>
          <FileText size={20} color={colors.warning} />
        </View>
        <Text style={[styles.overviewValue, { color: colors.text }]}>
          {currentChild.upcomingAssignments.filter((a) => a.status === 'pending').length}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Pending</Text>
      </View>
    </View>
  );

  const renderGradesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Grades</Text>
        <TouchableOpacity>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.gradesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {currentChild.recentGrades.map((grade, index) => (
          <View
            key={grade.subject}
            style={[
              styles.gradeRow,
              index < currentChild.recentGrades.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.gradeSubject, { color: colors.text }]}>{grade.subject}</Text>
            <View style={styles.gradeRight}>
              {getTrendIcon(grade.trend)}
              <Text style={[styles.gradeValue, { color: colors.text }]}>{grade.currentGrade}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAttendanceSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Attendance</Text>
        <TouchableOpacity>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>View History</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.attendanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {currentChild.attendance.map((record, index) => (
          <View
            key={record.date}
            style={[
              styles.attendanceRow,
              index < currentChild.attendance.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.attendanceDate, { color: colors.text }]}>
              {new Date(record.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.attendanceStatus}>
              {getAttendanceIcon(record.status)}
              <Text
                style={[
                  styles.attendanceStatusText,
                  {
                    color:
                      record.status === 'present'
                        ? colors.success
                        : record.status === 'absent'
                          ? colors.error
                          : colors.warning,
                  },
                ]}
              >
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAssignmentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Assignments</Text>
      </View>
      {currentChild.upcomingAssignments.map((assignment) => (
        <View
          key={assignment.id}
          style={[styles.assignmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.assignmentHeader}>
            <Text style={[styles.assignmentTitle, { color: colors.text }]} numberOfLines={1}>
              {assignment.title}
            </Text>
            <View
              style={[
                styles.assignmentStatus,
                {
                  backgroundColor:
                    assignment.status === 'submitted'
                      ? `${colors.success}15`
                      : `${colors.warning}15`,
                },
              ]}
            >
              <Text
                style={[
                  styles.assignmentStatusText,
                  {
                    color:
                      assignment.status === 'submitted' ? colors.success : colors.warning,
                  },
                ]}
              >
                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={[styles.assignmentSubject, { color: colors.textSecondary }]}>
            {assignment.subject}
          </Text>
          <Text
            style={[
              styles.assignmentDue,
              {
                color:
                  formatDate(assignment.dueDate) === 'Overdue'
                    ? colors.error
                    : formatDate(assignment.dueDate) === 'Due today'
                      ? colors.warning
                      : colors.textMuted,
              },
            ]}
          >
            {formatDate(assignment.dueDate)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTeachersSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Teachers</Text>
      </View>
      {currentChild.teachers.map((teacher, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.teacherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleMessageTeacher(teacher.name)}
        >
          <View style={[styles.teacherAvatar, { backgroundColor: colors.backgroundDark }]}>
            <User size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.teacherInfo}>
            <Text style={[styles.teacherName, { color: colors.text }]}>{teacher.name}</Text>
            <Text style={[styles.teacherSubject, { color: colors.textSecondary }]}>{teacher.subject}</Text>
          </View>
          <View style={[styles.messageButton, { backgroundColor: colors.primary }]}>
            <MessageSquare size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <RoleGuard allowedRoles={['parent', 'admin']}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundDark }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>My Children</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {children.length} children enrolled
            </Text>
          </View>
        </View>

        <FlatList
          data={['content']}
          renderItem={() => (
            <>
              {renderChildSelector()}
              {renderOverviewCards()}
              {renderGradesSection()}
              {renderAttendanceSection()}
              {renderAssignmentsSection()}
              {renderTeachersSection()}
            </>
          )}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.scrollContent}
        />
      </SafeAreaView>
    </RoleGuard>
  );
}

const Clock = ({ size, color }: { size: number; color: string }) => (
  <Calendar size={size} color={color} />
);

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
  scrollContent: {
    paddingBottom: 40,
  },
  childSelector: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
  },
  childGrade: {
    fontSize: 13,
    marginTop: 2,
  },
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradesCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  gradeSubject: {
    fontSize: 15,
    fontWeight: '500',
  },
  gradeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  attendanceCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendanceStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  assignmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  assignmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  assignmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assignmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assignmentSubject: {
    fontSize: 13,
    marginBottom: 4,
  },
  assignmentDue: {
    fontSize: 12,
    fontWeight: '500',
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  teacherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  teacherSubject: {
    fontSize: 13,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
