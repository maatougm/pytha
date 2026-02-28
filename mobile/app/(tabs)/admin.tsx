import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  MessageSquare,
  Shield,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Settings,
  BarChart3,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { RoleGuard } from '@/src/components/RoleGuard';
import { adminService } from '@/src/services/admin.service';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  color: string;
}

export default function AdminScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real admin stats from backend
  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getAnalytics(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStats();
    setRefreshing(false);
  }, [refetchStats]);

  const renderStatCard = ({ icon, label, value, color, onPress }: StatCardProps) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderActionCard = ({ icon, title, description, onPress, color }: ActionCardProps) => (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: colors.textSecondary }]} numberOfLines={1}>
          {description}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundDark }]} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
              <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Admin'}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
              <Shield size={14} color="#fff" />
              <Text style={styles.roleText}>Admin</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {renderStatCard({
              icon: <Users size={20} color={colors.primary} />,
              label: 'Total Users',
              value: stats?.totalUsers?.toLocaleString() || '0',
              color: colors.primary,
              onPress: () => router.push('/(app)/admin/users'),
            })}
            {renderStatCard({
              icon: <BookOpen size={20} color={colors.success} />,
              label: 'Total Classes',
              value: stats?.totalClasses || 0,
              color: colors.success,
              onPress: () => router.push('/(tabs)/courses'),
            })}
            {renderStatCard({
              icon: <AlertCircle size={20} color={colors.warning} />,
              label: 'Messages Today',
              value: stats?.messagesToday || 0,
              color: colors.warning,
              onPress: () => router.push('/(app)/admin/moderation'),
            })}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

            {renderActionCard({
              icon: <Users size={24} color={colors.primary} />,
              title: 'Manage Users',
              description: 'Add, edit, or deactivate user accounts',
              onPress: () => router.push('/(app)/admin/users'),
              color: colors.primary,
            })}

            {renderActionCard({
              icon: <Plus size={24} color={colors.info} />,
              title: 'Create Course',
              description: 'Add a new course to the catalog',
              onPress: () => router.push('/(app)/course/create'),
              color: colors.info,
            })}

            {renderActionCard({
              icon: <Shield size={24} color={colors.warning} />,
              title: 'Moderation Queue',
              description: `View moderation reports`,
              onPress: () => router.push('/(app)/admin/moderation'),
              color: colors.warning,
            })}

            {renderActionCard({
              icon: <BarChart3 size={24} color={colors.success} />,
              title: 'Analytics',
              description: 'View system usage and statistics',
              onPress: () => router.push('/(app)/admin/analytics'),
              color: colors.success,
            })}
          </View>

          {/* System Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>System</Text>

            {renderActionCard({
              icon: <Settings size={24} color={colors.textSecondary} />,
              title: 'Settings',
              description: 'Configure system preferences',
              onPress: () => router.push('/(app)/admin/settings' as Href),
              color: colors.textSecondary,
            })}

            {renderActionCard({
              icon: <MessageSquare size={24} color={colors.textSecondary} />,
              title: 'Broadcast Message',
              description: 'Send announcement to all users',
              onPress: () => router.push('/(app)/channel/broadcast' as Href),
              color: colors.textSecondary,
            })}
          </View>

          {/* Footer spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
  },
});
