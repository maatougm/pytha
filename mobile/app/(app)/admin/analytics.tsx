import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  BookOpen,
  MessageSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  MoreHorizontal,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalMessages: number;
    activeNow: number;
    userGrowth: number;
    courseGrowth: number;
    messageGrowth: number;
  };
  userGrowth: {
    labels: string[];
    data: number[];
  };
  messagesPerDay: {
    labels: string[];
    data: number[];
  };
  roleDistribution: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  activityTimeline: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'user_joined' | 'course_created' | 'message_sent' | 'assignment_submitted';
  description: string;
  timestamp: string;
  user: string;
}

const fetchAnalytics = async (): Promise<AnalyticsData> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    stats: {
      totalUsers: 1247,
      totalCourses: 48,
      totalMessages: 15234,
      activeNow: 156,
      userGrowth: 12.5,
      courseGrowth: 8.3,
      messageGrowth: -2.1,
    },
    userGrowth: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [980, 1050, 1120, 1180, 1210, 1247],
    },
    messagesPerDay: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [450, 520, 480, 610, 580, 320, 280],
    },
    roleDistribution: {
      labels: ['Students', 'Teachers', 'Parents', 'Admins'],
      data: [850, 48, 320, 29],
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    },
    activityTimeline: [
      { id: '1', type: 'user_joined', description: 'New student registered', timestamp: '2 min ago', user: 'Emma Wilson' },
      { id: '2', type: 'course_created', description: 'New course created', timestamp: '15 min ago', user: 'Dr. Sarah Chen' },
      { id: '3', type: 'message_sent', description: 'Announcement sent to all users', timestamp: '1 hour ago', user: 'Admin' },
      { id: '4', type: 'assignment_submitted', description: 'Physics assignment submitted', timestamp: '2 hours ago', user: 'Alex Johnson' },
      { id: '5', type: 'user_joined', description: 'New teacher registered', timestamp: '3 hours ago', user: 'Mr. Robert Davis' },
      { id: '6', type: 'course_created', description: 'Course updated', timestamp: '5 hours ago', user: 'Prof. Michael Lee' },
    ],
  };
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  user_joined: <Users size={18} color="#3b82f6" />,
  course_created: <BookOpen size={18} color="#10b981" />,
  message_sent: <MessageSquare size={18} color="#f59e0b" />,
  assignment_submitted: <FileText size={18} color="#8b5cf6" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  user_joined: '#3b82f6',
  course_created: '#10b981',
  message_sent: '#f59e0b',
  assignment_submitted: '#8b5cf6',
};

type TimeRange = '7d' | '30d' | '90d' | '1y';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: '1y', label: 'Last Year' },
];

export default function AdminAnalyticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: fetchAnalytics,
  });

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 30, 138, ${opacity})`,
    labelColor: (opacity = 1) => colors.textMuted,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const pieChartData = analytics?.roleDistribution.labels.map((label, index) => ({
    name: label,
    population: analytics.roleDistribution.data[index],
    color: analytics.roleDistribution.colors[index],
    legendFontColor: colors.text,
    legendFontSize: 12,
  })) || [];

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
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    exportText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    content: {
      flex: 1,
    },
    // Time Range Selector
    timeRangeContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timeRangeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundDark,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'flex-start',
    },
    timeRangeText: {
      fontSize: 14,
      color: colors.text,
      marginRight: 8,
    },
    // Stats Cards
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    statCard: {
      width: (width - 44) / 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 8,
    },
    statChange: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statChangePositive: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    statChangeNegative: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.error,
    },
    // Charts
    chartSection: {
      backgroundColor: colors.background,
      marginTop: 12,
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    chartTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    chartContainer: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 12,
      alignItems: 'center',
    },
    // Activity Timeline
    activitySection: {
      backgroundColor: colors.background,
      marginTop: 12,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    activityIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityDescription: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 2,
    },
    activityUser: {
      fontSize: 13,
      color: colors.textMuted,
    },
    activityTime: {
      fontSize: 12,
      color: colors.textMuted,
    },
    activityLine: {
      position: 'absolute',
      left: 18,
      top: 36,
      bottom: -16,
      width: 2,
      backgroundColor: colors.border,
    },
    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Dropdown
    dropdown: {
      position: 'absolute',
      top: 50,
      left: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 100,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 150,
    },
    dropdownItemSelected: {
      backgroundColor: `${colors.primary}15`,
    },
    dropdownText: {
      fontSize: 14,
      color: colors.text,
    },
    dropdownTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Download size={18} color={colors.primary} />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity 
            style={styles.timeRangeButton}
            onPress={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
          >
            <Text style={styles.timeRangeText}>
              {TIME_RANGES.find(t => t.key === timeRange)?.label}
            </Text>
            <ChevronDown size={18} color={colors.text} />
          </TouchableOpacity>

          {showTimeRangeDropdown && (
            <View style={styles.dropdown}>
              {TIME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.key}
                  style={[
                    styles.dropdownItem,
                    timeRange === range.key && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setTimeRange(range.key);
                    setShowTimeRangeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownText,
                    timeRange === range.key && styles.dropdownTextSelected,
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Users size={22} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{analytics?.stats.totalUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
            <View style={styles.statChange}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={styles.statChangePositive}>+{analytics?.stats.userGrowth}%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <BookOpen size={22} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{analytics?.stats.totalCourses}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
            <View style={styles.statChange}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={styles.statChangePositive}>+{analytics?.stats.courseGrowth}%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.info}15` }]}>
              <MessageSquare size={22} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{analytics?.stats.totalMessages.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Messages</Text>
            <View style={styles.statChange}>
              <TrendingDown size={14} color={colors.error} />
              <Text style={styles.statChangeNegative}>{analytics?.stats.messageGrowth}%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.warning}15` }]}>
              <Activity size={22} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{analytics?.stats.activeNow}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
            <View style={styles.statChange}>
              <Text style={[styles.statChangePositive, { color: colors.textMuted }]}>
                Real-time
              </Text>
            </View>
          </View>
        </View>

        {/* User Growth Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>User Growth</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: analytics?.userGrowth.labels || [],
                datasets: [{
                  data: analytics?.userGrowth.data || [],
                }],
              }}
              width={width - 56}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        </View>

        {/* Messages Per Day Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Messages Per Day</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: analytics?.messagesPerDay.labels || [],
                datasets: [{
                  data: analytics?.messagesPerDay.data || [],
                }],
              }}
              width={width - 56}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              style={{ borderRadius: 8 }}
              showValuesOnTopOfBars
            />
          </View>
        </View>

        {/* Role Distribution Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>User Role Distribution</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieChartData}
              width={width - 56}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={styles.activitySection}>
          <Text style={styles.chartTitle}>Recent Activity</Text>
          {analytics?.activityTimeline.map((activity, index) => (
            <View key={activity.id} style={styles.activityItem}>
              {index < (analytics.activityTimeline.length - 1) && (
                <View style={styles.activityLine} />
              )}
              <View style={[
                styles.activityIconContainer, 
                { backgroundColor: `${ACTIVITY_COLORS[activity.type]}20` }
              ]}>
                {ACTIVITY_ICONS[activity.type]}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityUser}>{activity.user}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.timestamp}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
