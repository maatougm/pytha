import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  MapPin,
  Users,
  FileText,
  Check,
  ChevronRight,
  Download,
  Play,
  Calendar,
  GraduationCap,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from '@/src/utils/date';

type TabType = 'overview' | 'assignments' | 'materials' | 'classmates';

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  department: string;
  teacher: {
    id: string;
    name: string;
    avatar?: string;
    bio: string;
    email: string;
  };
  enrollmentStatus: 'enrolled' | 'available' | 'completed';
  progress: number;
  totalStudents: number;
  schedule: {
    days: string[];
    time: string;
    room: string;
  };
  syllabus: string;
  startDate: string;
  endDate: string;
  credits: number;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  points: number;
  earnedPoints?: number;
}

interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'doc' | 'link';
  size?: string;
  uploadedAt: string;
}

interface Classmate {
  id: string;
  name: string;
  avatar?: string;
  role: 'student' | 'teacher';
  isOnline: boolean;
}

// Mock API
const fetchCourseDetail = async (courseId: string): Promise<CourseDetail> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    id: courseId,
    title: 'Advanced Mathematics',
    description: 'This course covers advanced mathematical concepts including calculus, linear algebra, differential equations, and their applications in real-world problems. Students will develop problem-solving skills and mathematical reasoning through rigorous coursework and practical exercises.',
    department: 'Mathematics',
    teacher: {
      id: 't1',
      name: 'Dr. Sarah Chen',
      bio: 'Ph.D. in Applied Mathematics from MIT. 15+ years of teaching experience in advanced calculus and mathematical modeling.',
      email: 's.chen@school.edu',
    },
    enrollmentStatus: 'enrolled',
    progress: 65,
    totalStudents: 28,
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday'],
      time: '10:00 AM - 11:30 AM',
      room: 'Room 302',
    },
    syllabus: 'Course Syllabus - Advanced Mathematics\n\nWeek 1-2: Limits and Continuity\nWeek 3-5: Differentiation\nWeek 6-8: Applications of Derivatives\nWeek 9-11: Integration\nWeek 12-14: Applications of Integrals\nWeek 15-16: Differential Equations\n\nGrading:\n- Assignments: 30%\n- Midterm: 25%\n- Final: 35%\n- Participation: 10%',
    startDate: '2026-01-15',
    endDate: '2026-05-30',
    credits: 4,
  };
};

const fetchAssignments = async (courseId: string): Promise<Assignment[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return [
    { id: '1', title: 'Problem Set 1: Limits', dueDate: '2026-02-28T23:59:00', status: 'submitted', points: 50 },
    { id: '2', title: 'Quiz 1: Derivatives', dueDate: '2026-03-05T10:00:00', status: 'pending', points: 100 },
    { id: '3', title: 'Problem Set 2: Chain Rule', dueDate: '2026-03-10T23:59:00', status: 'pending', points: 50 },
    { id: '4', title: 'Midterm Examination', dueDate: '2026-03-20T10:00:00', status: 'pending', points: 200 },
    { id: '5', title: 'Problem Set 3: Integration', dueDate: '2026-04-05T23:59:00', status: 'pending', points: 50 },
  ];
};

const fetchMaterials = async (courseId: string): Promise<Material[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: '1', title: 'Course Syllabus', type: 'pdf', size: '245 KB', uploadedAt: '2026-01-15' },
    { id: '2', title: 'Lecture Notes - Week 1', type: 'pdf', size: '1.2 MB', uploadedAt: '2026-01-16' },
    { id: '3', title: 'Introduction to Calculus Video', type: 'video', size: '45 MB', uploadedAt: '2026-01-17' },
    { id: '4', title: 'Practice Problems Set 1', type: 'doc', size: '890 KB', uploadedAt: '2026-01-20' },
    { id: '5', title: 'Khan Academy - Limits', type: 'link', uploadedAt: '2026-01-18' },
    { id: '6', title: 'Lecture Notes - Week 2', type: 'pdf', size: '1.5 MB', uploadedAt: '2026-01-23' },
  ];
};

const fetchClassmates = async (courseId: string): Promise<Classmate[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return [
    { id: 's1', name: 'Alex Johnson', role: 'student', isOnline: true },
    { id: 's2', name: 'Maria Garcia', role: 'student', isOnline: false },
    { id: 's3', name: 'James Wilson', role: 'student', isOnline: true },
    { id: 's4', name: 'Emma Brown', role: 'student', isOnline: false },
    { id: 's5', name: 'Michael Chen', role: 'student', isOnline: true },
    { id: 's6', name: 'Sophie Davis', role: 'student', isOnline: false },
    { id: 't1', name: 'Dr. Sarah Chen', role: 'teacher', isOnline: true },
  ];
};

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetail(courseId),
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: () => fetchAssignments(courseId),
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['course-materials', courseId],
    queryFn: () => fetchMaterials(courseId),
  });

  const { data: classmates, isLoading: classmatesLoading } = useQuery({
    queryKey: ['course-classmates', courseId],
    queryFn: () => fetchClassmates(courseId),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchCourse();
    setRefreshing(false);
  }, [refetchCourse]);

  const isEnrolled = course?.enrollmentStatus === 'enrolled';
  const isTeacher = user?.role === 'teacher';

  const getDaysUntil = (dateStr: string) => {
    const due = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {(['overview', 'assignments', 'materials', 'classmates'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab ? colors.primary : colors.textMuted },
              activeTab === tab && { fontWeight: '600' },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Progress Card */}
      {isEnrolled && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Course Progress</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{course?.progress}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.backgroundDark }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${course?.progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {Math.round((course?.progress || 0) / 100 * 16)} of 16 weeks completed
          </Text>
        </View>
      )}

      {/* Description */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>About this Course</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {course?.description}
        </Text>
      </View>

      {/* Schedule */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Schedule</Text>
        <View style={styles.scheduleItem}>
          <Calendar size={20} color={colors.primary} />
          <Text style={[styles.scheduleText, { color: colors.text }]}>
            {course?.schedule.days.join(', ')}
          </Text>
        </View>
        <View style={styles.scheduleItem}>
          <Clock size={20} color={colors.primary} />
          <Text style={[styles.scheduleText, { color: colors.text }]}>
            {course?.schedule.time}
          </Text>
        </View>
        <View style={styles.scheduleItem}>
          <MapPin size={20} color={colors.primary} />
          <Text style={[styles.scheduleText, { color: colors.text }]}>
            {course?.schedule.room}
          </Text>
        </View>
      </View>

      {/* Instructor */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Instructor</Text>
        <View style={styles.instructorRow}>
          <View style={[styles.instructorAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.instructorInitials}>{course?.teacher.name.charAt(0)}</Text>
          </View>
          <View style={styles.instructorInfo}>
            <Text style={[styles.instructorName, { color: colors.text }]}>
              {course?.teacher.name}
            </Text>
            <Text style={[styles.instructorBio, { color: colors.textSecondary }]} numberOfLines={2}>
              {course?.teacher.bio}
            </Text>
          </View>
        </View>
      </View>

      {/* Syllabus */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Syllabus</Text>
        <Text style={[styles.syllabusText, { color: colors.textSecondary }]}>
          {course?.syllabus}
        </Text>
      </View>
    </ScrollView>
  );

  const renderAssignments = () => (
    <FlatList
      data={assignments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No assignments yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.assignmentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push(`/(app)/assignment/${item.id}`)}
        >
          <View style={styles.assignmentHeader}>
            <View style={[styles.statusBadge, { 
              backgroundColor: item.status === 'submitted' ? `${colors.success}20` : 
                               item.status === 'graded' ? `${colors.primary}20` : `${colors.warning}20`,
            }]}>
              {item.status === 'submitted' && <Check size={14} color={colors.success} />}
              {item.status === 'graded' && <GraduationCap size={14} color={colors.primary} />}
              {item.status === 'pending' && <Clock size={14} color={colors.warning} />}
              <Text style={[styles.statusText, { 
                color: item.status === 'submitted' ? colors.success : 
                       item.status === 'graded' ? colors.primary : colors.warning,
              }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={[styles.pointsText, { color: colors.textMuted }]}>
              {item.earnedPoints !== undefined ? `${item.earnedPoints}/` : ''}{item.points} pts
            </Text>
          </View>
          <Text style={[styles.assignmentTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.dueText, { color: colors.textMuted }]}>
            {getDaysUntil(item.dueDate)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderMaterials = () => (
    <FlatList
      data={materials}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <BookOpen size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No materials yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.materialItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.materialIcon, { backgroundColor: colors.primary }]}>
            {item.type === 'pdf' && <FileText size={20} color="#fff" />}
            {item.type === 'video' && <Play size={20} color="#fff" />}
            {item.type === 'doc' && <BookOpen size={20} color="#fff" />}
            {item.type === 'link' && <ArrowLeft size={20} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />}
          </View>
          <View style={styles.materialInfo}>
            <Text style={[styles.materialTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.materialMeta, { color: colors.textMuted }]}>
              {item.type.toUpperCase()}{item.size ? ` • ${item.size}` : ''}
            </Text>
          </View>
          <Download size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    />
  );

  const renderClassmates = () => (
    <FlatList
      data={classmates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Users size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classmates yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.classmateItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.classmateAvatarContainer}>
            <View style={[styles.classmateAvatar, { 
              backgroundColor: item.role === 'teacher' ? colors.primary : colors.backgroundDark 
            }]}>
              <Text style={[styles.classmateInitials, { color: item.role === 'teacher' ? '#fff' : colors.text }]}>
                {item.name.charAt(0)}
              </Text>
            </View>
            {item.isOnline && (
              <View style={[styles.onlineIndicator, { borderColor: colors.surface }]} />
            )}
          </View>
          <View style={styles.classmateInfo}>
            <Text style={[styles.classmateName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.classmateRole, { color: colors.textMuted }]}>
              {item.role === 'teacher' ? 'Instructor' : 'Student'}
            </Text>
          </View>
          {item.role === 'teacher' && (
            <View style={[styles.teacherBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.teacherBadgeText, { color: colors.primary }]}>Teacher</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'assignments':
        return assignmentsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : renderAssignments();
      case 'materials':
        return materialsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : renderMaterials();
      case 'classmates':
        return classmatesLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : renderClassmates();
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerInfo: {
      flex: 1,
    },
    departmentBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 8,
    },
    departmentText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#fff',
    },
    courseTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    teacherRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    teacherAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    teacherInitials: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    teacherName: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    tabText: {
      fontSize: 14,
    },
    tabContent: {
      padding: 16,
      paddingBottom: 100,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressPercent: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 13,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    scheduleText: {
      fontSize: 15,
      marginLeft: 12,
    },
    instructorRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    instructorAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    instructorInitials: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    instructorInfo: {
      flex: 1,
    },
    instructorName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    instructorBio: {
      fontSize: 13,
      lineHeight: 18,
    },
    syllabusText: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'monospace',
    },
    assignmentItem: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    assignmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
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
    pointsText: {
      fontSize: 13,
    },
    assignmentTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    dueText: {
      fontSize: 13,
    },
    materialItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 12,
    },
    materialIcon: {
      width: 44,
      height: 44,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    materialInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    materialTitle: {
      fontSize: 15,
      fontWeight: '500',
      marginBottom: 2,
    },
    materialMeta: {
      fontSize: 12,
    },
    classmateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 12,
    },
    classmateAvatarContainer: {
      position: 'relative',
    },
    classmateAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    classmateInitials: {
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
    },
    classmateInfo: {
      flex: 1,
      marginLeft: 12,
    },
    classmateName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    classmateRole: {
      fontSize: 13,
    },
    teacherBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    teacherBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 12,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (courseLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={[styles.departmentBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.departmentText}>{course?.department.toUpperCase()}</Text>
            </View>
          </View>
          {isTeacher && (
            <TouchableOpacity style={{ padding: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.courseTitle}>{course?.title}</Text>
        <View style={styles.teacherRow}>
          <View style={styles.teacherAvatar}>
            <Text style={styles.teacherInitials}>{course?.teacher.name.charAt(0)}</Text>
          </View>
          <Text style={styles.teacherName}>{course?.teacher.name} • {course?.totalStudents} students</Text>
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/(app)/chat/${courseId}`)}
          >
            <BookOpen size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Continue Learning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Check size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Enroll in Course</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
