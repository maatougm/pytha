import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  ChevronRight,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Shield,
  UserPlus,
  GraduationCap,
  Megaphone,
  TrendingDown,
  Baby,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { useDashboardStats, useTodaysSchedule, useRecentActivity } from '@/src/hooks/useDashboard';
import type { ScheduleItem, ActivityItem } from '@/services/api';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: schedule, isLoading: scheduleLoading, refetch: refetchSchedule } = useTodaysSchedule();
  const { data: activities, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchSchedule(), refetchActivity()]);
    setRefreshing(false);
  }, [refetchStats, refetchSchedule, refetchActivity]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return '#f59e0b';
      case 'parent':
        return '#9c27b0';
      case 'admin':
        return '#2196f3';
      default:
        return '#4caf50';
    }
  };

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    color: string,
    index: number
  ) => (
    <View
      key={index}
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const renderStatsSection = () => {
    if (statsLoading) {
      return (
        <View style={styles.statsContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                styles.skeleton,
                { backgroundColor: colors.backgroundDark },
              ]}
            />
          ))}
        </View>
      );
    }

    const statsData = stats || { upcomingClasses: 0, pendingAssignments: 0, unreadMessages: 0 };

    if (user?.role === 'teacher') {
      return (
        <View style={styles.statsContainer}>
          {renderStatCard(
            <BookOpen size={20} color={colors.primary} />,
            "Today's Classes",
            statsData.upcomingClasses || 0,
            colors.primary,
            0
          )}
          {renderStatCard(
            <FileText size={20} color={colors.warning} />,
            'Pending Assignments',
            statsData.pendingAssignments || 0,
            colors.warning,
            1
          )}
          {renderStatCard(
            <MessageSquare size={20} color={colors.info} />,
            'Unread Messages',
            statsData.unreadMessages || 0,
            colors.info,
            2
          )}
        </View>
      );
    }

    if (user?.role === 'admin') {
      return (
        <View style={styles.statsContainer}>
          {renderStatCard(
            <Users size={20} color={colors.primary} />,
            'Upcoming Classes',
            statsData.upcomingClasses || 0,
            colors.primary,
            0
          )}
          {renderStatCard(
            <BookOpen size={20} color={colors.success} />,
            'Pending Assignments',
            statsData.pendingAssignments || 0,
            colors.success,
            1
          )}
          {renderStatCard(
            <AlertCircle size={20} color={colors.warning} />,
            'Unread Messages',
            statsData.unreadMessages || 0,
            colors.warning,
            2
          )}
        </View>
      );
    }

    // Default student view
    return (
      <View style={styles.statsContainer}>
        {renderStatCard(
          <Clock size={20} color={colors.primary} />,
          'Upcoming Classes',
          statsData.upcomingClasses || 0,
          colors.primary,
          0
        )}
        {renderStatCard(
          <FileText size={20} color={colors.warning} />,
          'Pending Assignments',
          statsData.pendingAssignments || 0,
          colors.warning,
          1
        )}
        {renderStatCard(
          <MessageSquare size={20} color={colors.info} />,
          'Unread Messages',
          statsData.unreadMessages || 0,
          colors.info,
          2
        )}
      </View>
    );
  };

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <View style={[styles.scheduleItem, { borderLeftColor: item.color }]}>
      <View style={styles.scheduleTimeContainer}>
        <Text style={[styles.scheduleTime, { color: colors.primary }]}>{item.time}</Text>
      </View>
      <View style={[styles.scheduleContent, { backgroundColor: colors.backgroundDark }]}>
        <Text style={[styles.scheduleSubject, { color: colors.text }]}>{item.title}</Text>
        {!!item.subject && (
          <Text style={[styles.scheduleTeacher, { color: colors.textSecondary }]}>
            {item.subject}
          </Text>
        )}
        <Text style={[styles.scheduleRoom, { color: colors.textMuted }]}>{item.location}</Text>
      </View>
    </View>
  );

  const renderActivityItem = ({ item }: { item: ActivityItem }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'assignment':
          return <FileText size={18} color={colors.primary} />;
        case 'grade':
          return <TrendingUp size={18} color={colors.success} />;
        case 'message':
          return <MessageSquare size={18} color={colors.info} />;
        default:
          return <Bell size={18} color={colors.textMuted} />;
      }
    };

    return (
      <TouchableOpacity style={[styles.activityItem, { borderBottomColor: colors.border }]}>
        <View style={[styles.activityIconContainer, { backgroundColor: colors.backgroundDark }]}>
          {getIcon()}
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.course && (
            <Text style={[styles.activityCourse, { color: colors.textSecondary }]}>
              {item.course}
            </Text>
          )}
          <Text style={[styles.activityTime, { color: colors.textMuted }]}>{item.timestamp}</Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderQuickActions = () => {
    // Admin Quick Actions
    if (user?.role === 'admin') {
      return (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(app)/admin/users')}
          >
            <UserPlus size={20} color="#fff" />
            <Text style={styles.quickActionText}>Add User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.info }]}
            onPress={() => router.push('/(app)/course/create')}
          >
            <GraduationCap size={20} color="#fff" />
            <Text style={styles.quickActionText}>Create Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.warning }]}
            onPress={() => router.push('/(app)/admin/moderation')}
          >
            <Shield size={20} color="#fff" />
            <Text style={styles.quickActionText}>Moderation</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Teacher Quick Actions
    if (user?.role === 'teacher') {
      return (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(app)/attendance/mark')}
          >
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.quickActionText}>Take Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.info }]}
            onPress={() => router.push('/(app)/teacher/grading')}
          >
            <FileText size={20} color="#fff" />
            <Text style={styles.quickActionText}>Grade Work</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.success }]}>
            <MessageSquare size={20} color="#fff" />
            <Text style={styles.quickActionText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Parent Quick Actions
    if (user?.role === 'parent') {
      return (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(app)/parent/children')}
          >
            <Baby size={20} color="#fff" />
            <Text style={styles.quickActionText}>View Children</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.info }]}>
            <MessageSquare size={20} color="#fff" />
            <Text style={styles.quickActionText}>Message Teachers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.success }]}>
            <TrendingUp size={20} color="#fff" />
            <Text style={styles.quickActionText}>View Progress</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    greeting: {
      flex: 1,
    },
    greetingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    nameText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      textTransform: 'capitalize',
    },
    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#fff',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
      marginTop: 16,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
    },
    skeleton: {
      height: 100,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      marginTop: 2,
      textAlign: 'center',
    },
    section: {
      marginTop: 24,
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
      color: colors.text,
    },
    sectionLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    scheduleItem: {
      flexDirection: 'row',
      marginBottom: 12,
      borderLeftWidth: 4,
      borderRadius: 4,
    },
    scheduleTimeContainer: {
      width: 70,
      justifyContent: 'center',
    },
    scheduleTime: {
      fontSize: 14,
      fontWeight: '600',
    },
    scheduleContent: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
    },
    scheduleSubject: {
      fontSize: 16,
      fontWeight: '600',
    },
    scheduleTeacher: {
      fontSize: 14,
      marginTop: 2,
    },
    scheduleRoom: {
      fontSize: 12,
      marginTop: 2,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityContent: {
      flex: 1,
      marginLeft: 12,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    activityCourse: {
      fontSize: 12,
      marginTop: 2,
    },
    activityTime: {
      fontSize: 12,
      marginTop: 2,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginTop: 20,
    },
    quickActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    quickActionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
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
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.nameText}>{user?.name || 'Student'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || 'student') }]}>
              <Text style={styles.roleText}>{user?.role || 'Student'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={22} color={colors.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        {renderStatsSection()}

        {/* Quick Actions for Teachers */}
        {renderQuickActions()}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {scheduleLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <FlatList
              data={schedule || []}
              renderItem={renderScheduleItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No classes scheduled for today</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
          {activityLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <FlatList
              data={activities || []}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No recent activity</Text>
                </View>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
