import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  SlidersHorizontal,
  Check,
  User,
  Clock,
  MapPin,
  Plus,
  Edit3,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { useCourses } from '@/src/hooks/useCourses';
import type { Course } from '@/src/types/api';
import { router } from 'expo-router';

type FilterType = 'all' | 'enrolled' | 'my-classes' | 'mathematics' | 'science' | 'languages' | 'arts';

const getFilters = (role?: string): { key: FilterType; label: string }[] => {
  const baseFilters = [
    { key: 'all' as FilterType, label: 'All' },
    { key: 'mathematics' as FilterType, label: 'Mathematics' },
    { key: 'science' as FilterType, label: 'Science' },
    { key: 'languages' as FilterType, label: 'Languages' },
    { key: 'arts' as FilterType, label: 'Arts' },
  ];

  if (role === 'teacher') {
    return [
      { key: 'all' as FilterType, label: 'All' },
      { key: 'my-classes' as FilterType, label: 'My Classes' },
      ...baseFilters.slice(1),
    ];
  }

  if (role === 'student') {
    return [
      { key: 'all' as FilterType, label: 'All' },
      { key: 'enrolled' as FilterType, label: 'My Enrollments' },
      ...baseFilters.slice(1),
    ];
  }

  if (role === 'parent') {
    return [
      { key: 'all' as FilterType, label: 'All' },
      { key: 'enrolled' as FilterType, label: 'Child Courses' },
      ...baseFilters.slice(1),
    ];
  }

  return baseFilters;
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Science: '#14b8a6',
  History: '#f59e0b',
  Languages: '#8b5cf6',
  Mathematics: '#3b82f6',
  Arts: '#ec4899',
};

export default function CoursesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin, isTeacher, isStudent } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    isTeacher() ? 'my-classes' : isStudent() ? 'enrolled' : 'all'
  );
  const [refreshing, setRefreshing] = useState(false);

  const { data: courses, isLoading, refetch } = useCourses(activeFilter);

  const FILTERS = getFilters(user?.role);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredCourses = courses?.filter((course) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const teacherName = course.createdBy ? `${course.createdBy.firstName} ${course.createdBy.lastName}`.toLowerCase() : '';
      return (
        course.name.toLowerCase().includes(query) ||
        teacherName.includes(query) ||
        (course.department && course.department.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const enrolledCount = 0; // The true enrollment logic requires a Class object; keeping count 0 for Course view.

  const handleCreateCourse = () => {
    router.push('/(app)/course/create');
  };

  const handleManageCourse = (courseId: string) => {
    if (isTeacher() || isAdmin()) {
      router.push(`/(app)/course/${courseId}/manage`);
    }
  };

  const renderFilterChip = ({ key, label }: { key: FilterType; label: string }) => {
    const isActive = activeFilter === key;
    return (
      <TouchableOpacity
        key={key}
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
      </TouchableOpacity>
    );
  };

  const renderCourseCard = ({ item }: { item: Course }) => {
    const deptColor = DEPARTMENT_COLORS[item.department || 'Science'] || colors.primary;
    const isEnrolled = false; // Need class data for enrollment status
    const progress = 0;
    const teacherName = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'TBA';

    return (
      <TouchableOpacity
        style={[
          styles.courseCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => router.push(`/(app)/course/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Thumbnail Placeholder */}
        <View style={[styles.thumbnail, { backgroundColor: `${deptColor}20` }]}>
          <Text style={[styles.thumbnailText, { color: deptColor }]}>
            {item.name.charAt(0)}
          </Text>
          <View
            style={[
              styles.departmentBadge,
              { backgroundColor: `${deptColor}CC` },
            ]}
          >
            <Text style={styles.departmentBadgeText}>{(item.department || 'GENERAL').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.courseContent}>
          <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.teacherRow}>
            <View style={[styles.teacherAvatar, { backgroundColor: colors.backgroundDark }]}>
              <User size={14} color={colors.textSecondary} />
            </View>
            <Text style={[styles.teacherName, { color: colors.textSecondary }]}>
              {teacherName}
            </Text>
          </View>

          {isEnrolled && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.backgroundDark }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: colors.success },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {progress}% Complete
              </Text>
            </View>
          )}

          <View style={styles.courseMeta}>
            <View style={styles.metaItem}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                TBA
              </Text>
            </View>
          </View>

          <View style={styles.enrollmentRow}>
            {isEnrolled ? (
              <View style={[styles.enrolledBadge, { backgroundColor: `${colors.success}15` }]}>
                <Check size={12} color={colors.success} />
                <Text style={[styles.enrolledText, { color: colors.success }]}>
                  {isTeacher() ? 'Teaching' : isStudent() ? 'Enrolled' : 'Active'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.enrollButton, { borderColor: colors.primary }]}
              >
                <Text style={[styles.enrollText, { color: colors.primary }]}>
                  {isTeacher() ? 'Manage' : 'Enroll'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.studentsText, { color: colors.textMuted }]}>
              {item.credits || 0} credits
            </Text>
          </View>

          {/* Role-specific actions */}
          {(isTeacher() || isAdmin()) && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.backgroundDark }]}
                onPress={() => handleManageCourse(item.id)}
              >
                <Edit3 size={14} color={colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Manage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.backgroundDark }]}
              >
                <Users size={14} color={colors.textSecondary} />
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Students
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Search size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No courses found' : 'No courses available'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : 'Check back later for new course offerings'}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: colors.text,
    },
    filterButton: {
      padding: 8,
      marginLeft: 4,
    },
    filtersContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: '500',
    },
    createCourseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom: 12,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    createCourseText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.05)',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '500',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    listContainer: {
      padding: 20,
      paddingTop: 8,
      paddingBottom: 100,
    },
    courseCard: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
      overflow: 'hidden',
    },
    thumbnail: {
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    thumbnailText: {
      fontSize: 48,
      fontWeight: 'bold',
    },
    departmentBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
    },
    departmentBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    courseContent: {
      padding: 16,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    teacherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    teacherAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    teacherName: {
      fontSize: 14,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
    },
    courseMeta: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      flex: 1,
    },
    metaText: {
      fontSize: 12,
      marginLeft: 4,
    },
    enrollmentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    enrolledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    enrolledText: {
      fontSize: 12,
      fontWeight: '600',
    },
    enrollButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1.5,
    },
    enrollText: {
      fontSize: 12,
      fontWeight: '600',
    },
    studentsText: {
      fontSize: 12,
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
      height: 280,
      borderRadius: 16,
      marginBottom: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, teachers, or subjects..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Course Button for Admin/Teacher */}
      {(isAdmin() || isTeacher()) && (
        <TouchableOpacity
          style={[styles.createCourseButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateCourse}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.createCourseText}>
            {isAdmin() ? 'Create Course' : 'Create New Class'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Filter Chips */}
      <FlatList
        data={FILTERS}
        renderItem={({ item }) => renderFilterChip(item)}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      />

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeFilter === 'all' ? 'All Courses' : 'My Courses'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {activeFilter === 'enrolled' ? enrolledCount : filteredCourses?.length || 0}
          </Text>
        </View>
      </View>

      {/* Courses List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { backgroundColor: colors.background }]}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
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
