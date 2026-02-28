import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Image } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Search, MessageCircle, User, Mail, Filter } from 'lucide-react-native';

const FILTERS = ['All', 'Teachers', 'Students', 'Parents', 'Admins'];

const USERS = [
  { id: '1', name: 'Alice Johnson', role: 'Student', department: 'Grade 10', avatar: 'https://i.pravatar.cc/150?u=1', color: '#2563EB' },
  { id: '2', name: 'Mr. David Chen', role: 'Teacher', department: 'Mathematics', avatar: 'https://i.pravatar.cc/150?u=2', color: '#0D9488' },
  { id: '3', name: 'Sarah Miller', role: 'Parent', department: 'Parent of Grade 8', avatar: 'https://i.pravatar.cc/150?u=3', color: '#7C3AED' },
  { id: '4', name: 'Admin User', role: 'Admin', department: 'IT Department', avatar: null, color: '#DC2626' },
  { id: '5', name: 'Bob Smith', role: 'Student', department: 'Grade 11', avatar: 'https://i.pravatar.cc/150?u=5', color: '#2563EB' },
  { id: '6', name: 'Emily Wilson', role: 'Teacher', department: 'Science', avatar: 'https://i.pravatar.cc/150?u=6', color: '#0D9488' },
];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Teacher': return '#0D9488';
    case 'Student': return '#2563EB';
    case 'Parent': return '#7C3AED';
    case 'Admin': return '#DC2626';
    default: return '#6B7280';
  }
};

export default function UserDirectoryScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = USERS.filter(user => {
    const matchesFilter = activeFilter === 'All' || user.role === activeFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Directory</Text>
          <TouchableOpacity style={styles.filterButton}><Filter size={20} color="#FFFFFF" /></TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search people..." 
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* User List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>{filteredUsers.length} people found</Text>
        {filteredUsers.map(user => (
          <View key={user.id} style={styles.userCard}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: user.color }]}>
                <Text style={styles.avatarInitials}>{user.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user.role)}15` }]}>
                  <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>{user.role}</Text>
                </View>
                <Text style={styles.department}>{user.department}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}><MessageCircle size={18} color="#1E3A8A" /></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Mail size={18} color="#1E3A8A" /></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 48 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  filterButton: { padding: 4 },
  searchContainer: { paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0F172A', fontFamily: 'Inter' },
  filterContainer: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterChipActive: { backgroundColor: '#FFFFFF' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#CBD5E1', fontFamily: 'Inter' },
  filterChipTextActive: { color: '#1E3A8A' },
  content: { flex: 1, padding: 16 },
  resultCount: { fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: 'Inter' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  department: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
});
