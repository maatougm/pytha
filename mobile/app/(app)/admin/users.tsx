import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Plus,
  Filter,
  MoreVertical,
  User,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Shield,
  GraduationCap,
  Users,
  X,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  lastActive: string;
  createdAt: string;
}

type FilterType = 'all' | 'admin' | 'teacher' | 'parent' | 'student';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Users' },
  { key: 'admin', label: 'Admins' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'parent', label: 'Parents' },
  { key: 'student', label: 'Students' },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield size={14} color="#fff" />,
  teacher: <GraduationCap size={14} color="#fff" />,
  parent: <Users size={14} color="#fff" />,
  student: <User size={14} color="#fff" />,
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#f59e0b',
  teacher: '#3b82f6',
  parent: '#10b981',
  student: '#8b5cf6',
};

const fetchUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { id: '1', name: 'John Smith', email: 'john.smith@school.edu', role: 'admin', status: 'active', lastActive: '2 min ago', createdAt: '2025-09-01' },
    { id: '2', name: 'Dr. Sarah Chen', email: 's.chen@school.edu', role: 'teacher', status: 'active', lastActive: '5 min ago', createdAt: '2025-09-01' },
    { id: '3', name: 'Michael Johnson', email: 'm.johnson@school.edu', role: 'teacher', status: 'active', lastActive: '1 hour ago', createdAt: '2025-09-15' },
    { id: '4', name: 'Emma Williams', email: 'emma.w@school.edu', role: 'student', status: 'active', lastActive: '10 min ago', createdAt: '2025-09-01' },
    { id: '5', name: 'James Brown', email: 'james.b@school.edu', role: 'student', status: 'inactive', lastActive: '2 weeks ago', createdAt: '2025-09-01' },
    { id: '6', name: 'Lisa Davis', email: 'lisa.davis@school.edu', role: 'parent', status: 'active', lastActive: '3 hours ago', createdAt: '2025-10-01' },
    { id: '7', name: 'Robert Wilson', email: 'r.wilson@school.edu', role: 'teacher', status: 'active', lastActive: '30 min ago', createdAt: '2025-09-20' },
    { id: '8', name: 'Sophie Martinez', email: 'sophie.m@school.edu', role: 'student', status: 'suspended', lastActive: '1 month ago', createdAt: '2025-09-01' },
    { id: '9', name: 'David Lee', email: 'david.lee@school.edu', role: 'parent', status: 'active', lastActive: '1 day ago', createdAt: '2025-10-15' },
    { id: '10', name: 'Amanda Taylor', email: 'a.taylor@school.edu', role: 'student', status: 'active', lastActive: '15 min ago', createdAt: '2025-09-01' },
  ];
};

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowUserMenu(false);
      Alert.alert('Success', 'User deleted successfully');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowUserMenu(false);
      Alert.alert('Success', 'User status updated');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredUsers = users?.filter((user) => {
    const matchesFilter = activeFilter === 'all' || user.role === activeFilter;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: users?.length || 0,
    active: users?.filter(u => u.status === 'active').length || 0,
    inactive: users?.filter(u => u.status === 'inactive').length || 0,
    suspended: users?.filter(u => u.status === 'suspended').length || 0,
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setShowUserMenu(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(selectedUser.id)
        },
      ]
    );
  };

  const handleToggleStatus = () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === 'active' ? 'inactive' : 'active';
    statusMutation.mutate({ userId: selectedUser.id, status: newStatus });
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

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] }]}>
        {ROLE_ICONS[item.role]}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.userMeta}>
          <Mail size={12} color={colors.textMuted} />
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <View style={styles.userMeta}>
          <Text style={[styles.roleBadge, { 
            color: ROLE_COLORS[item.role],
            backgroundColor: `${ROLE_COLORS[item.role]}15`,
          }]}>
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: item.status === 'active' ? colors.success : 
                            item.status === 'inactive' ? colors.textMuted : colors.error 
          }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <Text style={[styles.lastActive, { color: colors.textMuted }]}>
          {item.lastActive}
        </Text>
        <MoreVertical size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 48,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 12,
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
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    listContainer: {
      padding: 16,
      paddingTop: 0,
      paddingBottom: 100,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginLeft: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    userEmail: {
      fontSize: 12,
      flex: 1,
    },
    roleBadge: {
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 11,
    },
    userActions: {
      alignItems: 'flex-end',
    },
    lastActive: {
      fontSize: 12,
      marginBottom: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
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
      elevation: 4,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemIcon: {
      marginRight: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
    },
    menuItemDanger: {
      color: colors.error,
    },
    menuCancel: {
      marginTop: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    menuCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    // Add User Modal
    addModalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    roleSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    roleOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    roleOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    roleOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    roleOptionTextSelected: {
      color: colors.primary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.backgroundDark,
    },
    modalButtonSave: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          renderItem={({ item }) => renderFilterChip(item)}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.textMuted }]}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error }]}>{stats.suspended}</Text>
          <Text style={styles.statLabel}>Suspended</Text>
        </View>
      </View>

      {/* Users List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserMenu(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setShowUserMenu(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <Edit2 size={20} color={colors.text} style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Edit User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleToggleStatus}>
              {selectedUser?.status === 'active' ? (
                <>
                  <UserX size={20} color={colors.warning} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Deactivate User</Text>
                </>
              ) : (
                <>
                  <UserCheck size={20} color={colors.success} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Activate User</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteUser}>
              <Trash2 size={20} color={colors.error} style={styles.menuItemIcon} />
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowUserMenu(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {(['teacher', 'parent', 'student'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={styles.roleOption}
                  >
                    <Text style={styles.roleOptionText}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
