import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Bell,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useParent } from '@/src/hooks/useParent';
import { useAuth } from '@/providers/AuthProvider';
import { Header } from '@/src/components/Header';
import { Card } from '@/src/components/Card';
import { useRouter, Href } from 'expo-router';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const { user } = useAuth();
  const {
    children,
    selectedChild,
    progress,
    isLoading,
    selectChild,
    refreshChildren,
    refreshProgress,
  } = useParent();

  const onRefresh = async () => {
    await refreshChildren();
    await refreshProgress();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} color={colors.success} />;
      case 'down':
        return <TrendingDown size={16} color={colors.error} />;
      default:
        return <Minus size={16} color={colors.textMuted} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    // Children Selector
    childrenSelector: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    childCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      marginRight: spacing.md,
      minWidth: 200,
    },
    selectedChildCard: {
      borderColor: colors.primary,
    },
    unselectedChildCard: {
      borderColor: colors.border,
      opacity: 0.7,
    },
    childAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    childAvatarText: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.lg,
      color: colors.primary,
    },
    childInfo: {
      flex: 1,
    },
    childName: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    childGrade: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      minWidth: 150,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.xl,
      color: colors.text,
    },
    statLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    // Section
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.lg,
      color: colors.text,
    },
    seeAll: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
    // Course Progress
    courseCard: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    courseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    courseName: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.text,
      flex: 1,
    },
    courseGrade: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.lg,
      color: colors.primary,
    },
    courseTeacher: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
    },
    progressText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    // Quick Actions
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    actionButton: {
      flex: 1,
      minWidth: 100,
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    actionLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.text,
      textAlign: 'center',
    },
    // Activity Item
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    activityDesc: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    activityTime: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.xs,
      color: colors.textMuted,
    },
    // Empty State
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Parent Dashboard" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Children Selector */}
        {children.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.childrenSelector}
          >
            {children.map(child => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  selectedChild?.id === child.id
                    ? styles.selectedChildCard
                    : styles.unselectedChildCard,
                ]}
                onPress={() => selectChild(child)}
              >
                <View style={styles.childAvatar}>
                  {child.avatar ? (
                    <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                  ) : (
                    <Text style={styles.childAvatarText}>{child.name[0]}</Text>
                  )}
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childGrade}>Grade {child.grade}-{child.section}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedChild && progress && (
          <>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                  <GraduationCap size={20} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{progress.overallGrade}</Text>
                <Text style={styles.statLabel}>Overall Grade</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Calendar size={20} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>{progress.attendance.rate.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Award size={20} color={colors.warning} />
                </View>
                <Text style={styles.statValue}>{progress.gpa.toFixed(1)}</Text>
                <Text style={styles.statLabel}>GPA</Text>
              </Card>

              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
                  <FileText size={20} color={colors.info} />
                </View>
                <Text style={styles.statValue}>
                  {progress.courseProgress.reduce((sum, c) => sum + c.assignmentsCompleted, 0)}
                </Text>
                <Text style={styles.statLabel}>Assignments</Text>
              </Card>
            </View>

            {/* Course Progress */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Course Progress</Text>
                <TouchableOpacity onPress={() => router.push('/parent/grades' as Href)}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              {progress.courseProgress.slice(0, 3).map(course => (
                <Card key={course.courseId} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseName}>{course.courseName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {getTrendIcon(course.trend)}
                      <Text style={styles.courseGrade}>{course.currentGrade}</Text>
                    </View>
                  </View>
                  <Text style={styles.courseTeacher}>{course.teacher}</Text>
                  
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${course.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {course.assignmentsCompleted} of {course.assignmentsTotal} assignments • {course.percentage.toFixed(0)}%
                  </Text>
                </Card>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/parent/payments')}
                >
                  <View style={styles.actionIcon}>
                    <CreditCard size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Pay Fees</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/parent/conferences')}
                >
                  <View style={styles.actionIcon}>
                    <Users size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Meet Teacher</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/parent/messages' as Href)}
                >
                  <View style={styles.actionIcon}>
                    <MessageSquare size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Messages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/parent/reports' as Href)}
                >
                  <View style={styles.actionIcon}>
                    <FileText size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Reports</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/parent/activity' as Href)}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              {progress.recentActivity.slice(0, 5).map(activity => {
                const iconColors = {
                  grade: colors.success,
                  attendance: colors.primary,
                  assignment: colors.warning,
                  behavior: colors.info,
                  announcement: colors.error,
                };

                const icons = {
                  grade: Award,
                  attendance: Calendar,
                  assignment: FileText,
                  behavior: AlertCircle,
                  announcement: Bell,
                };

                const Icon = icons[activity.type];

                return (
                  <View key={activity.id} style={styles.activityItem}>
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: iconColors[activity.type] + '20' },
                      ]}
                    >
                      <Icon size={18} color={iconColors[activity.type]} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDesc}>{activity.description}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!selectedChild && !isLoading && (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No children linked to your account</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
