import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react-native';

const GPA_DATA = {
  current: 3.75,
  max: 4.0,
  trend: 'up',
  change: '+0.15',
};

const GRADE_DISTRIBUTION = [
  { grade: 'A', count: 4, color: '#10B981' },
  { grade: 'B', count: 2, color: '#3B82F6' },
  { grade: 'C', count: 1, color: '#F59E0B' },
  { grade: 'D', count: 0, color: '#F97316' },
  { grade: 'F', count: 0, color: '#EF4444' },
];

const COURSES = [
  {
    id: '1',
    name: 'Advanced Mathematics',
    teacher: 'Ms. Sarah Johnson',
    grade: 'A',
    percentage: 95,
    trend: 'up',
    color: '#10B981',
  },
  {
    id: '2',
    name: 'Physics',
    teacher: 'Mr. David Chen',
    grade: 'A-',
    percentage: 92,
    trend: 'up',
    color: '#10B981',
  },
  {
    id: '3',
    name: 'English Literature',
    teacher: 'Mrs. Emily Davis',
    grade: 'B+',
    percentage: 88,
    trend: 'down',
    color: '#3B82F6',
  },
  {
    id: '4',
    name: 'Chemistry',
    teacher: 'Dr. Michael Brown',
    grade: 'B',
    percentage: 85,
    trend: 'stable',
    color: '#3B82F6',
  },
  {
    id: '5',
    name: 'History',
    teacher: 'Mr. James Wilson',
    grade: 'A',
    percentage: 94,
    trend: 'up',
    color: '#10B981',
  },
  {
    id: '6',
    name: 'Computer Science',
    teacher: 'Ms. Lisa Anderson',
    grade: 'C+',
    percentage: 78,
    trend: 'down',
    color: '#F59E0B',
  },
];

export default function MyGradesScreen() {
  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <TrendingUp size={16} color="#10B981" />;
    } else if (trend === 'down') {
      return <TrendingDown size={16} color="#EF4444" />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Grades</Text>
          <View style={styles.placeholder} />
        </View>

        {/* GPA Card */}
        <View style={styles.gpaCard}>
          <View style={styles.gpaHeader}>
            <View>
              <Text style={styles.gpaLabel}>Current GPA</Text>
              <Text style={styles.gpaValue}>{GPA_DATA.current}</Text>
              <Text style={styles.gpaMax}>out of {GPA_DATA.max}</Text>
            </View>
            <View style={styles.gpaTrend}>
              {GPA_DATA.trend === 'up' ? (
                <TrendingUp size={24} color="#10B981" />
              ) : (
                <TrendingDown size={24} color="#EF4444" />
              )}
              <Text
                style={[
                  styles.gpaChange,
                  GPA_DATA.trend === 'up' ? styles.gpaChangeUp : styles.gpaChangeDown,
                ]}
              >
                {GPA_DATA.change}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(GPA_DATA.current / GPA_DATA.max) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Grade Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grade Distribution</Text>
          <View style={styles.distributionContainer}>
            {GRADE_DISTRIBUTION.map((item) => (
              <View key={item.grade} style={styles.distributionItem}>
                <View
                  style={[
                    styles.distributionBar,
                    { height: Math.max(item.count * 20, 8), backgroundColor: item.color },
                  ]}
                />
                <Text style={styles.distributionGrade}>{item.grade}</Text>
                <Text style={styles.distributionCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Grades</Text>
          {COURSES.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseTeacher}>{course.teacher}</Text>
                <View style={styles.courseProgress}>
                  <View style={styles.progressBarSmall}>
                    <View
                      style={[
                        styles.progressFillSmall,
                        { width: `${course.percentage}%`, backgroundColor: course.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.coursePercentage}>{course.percentage}%</Text>
                </View>
              </View>
              <View style={styles.courseGrade}>
                <View
                  style={[
                    styles.gradeBadge,
                    { backgroundColor: `${course.color}20` },
                  ]}
                >
                  <Text style={[styles.gradeText, { color: course.color }]}>
                    {course.grade}
                  </Text>
                </View>
                {getTrendIcon(course.trend)}
                <ChevronRight size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 32,
  },
  gpaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gpaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  gpaLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  gpaValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  gpaMax: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  gpaTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpaChange: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  gpaChangeUp: {
    color: '#10B981',
  },
  gpaChangeDown: {
    color: '#EF4444',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  distributionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  distributionItem: {
    alignItems: 'center',
  },
  distributionBar: {
    width: 32,
    borderRadius: 4,
    marginBottom: 8,
  },
  distributionGrade: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  distributionCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseTeacher: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  courseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarSmall: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  coursePercentage: {
    fontSize: 12,
    color: '#6B7280',
    width: 36,
  },
  courseGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});
