import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Mail, Phone, MoreVertical, Users, TrendingUp } from 'lucide-react-native';

const TABS = ['Students', 'Grades', 'Attendance'];

const STUDENTS = [
  { id: '1', name: 'Alice Johnson', email: 'alice.j@school.com', grade: 'A', attendance: '95%', parent: 'Sarah Johnson' },
  { id: '2', name: 'Bob Smith', email: 'bob.smith@school.com', grade: 'B+', attendance: '88%', parent: 'Michael Smith' },
  { id: '3', name: 'Charlie Brown', email: 'charlie.b@school.com', grade: 'A-', attendance: '92%', parent: 'Emily Brown' },
  { id: '4', name: 'Diana Prince', email: 'diana.p@school.com', grade: 'A+', attendance: '98%', parent: 'John Prince' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan.h@school.com', grade: 'B', attendance: '85%', parent: 'Lisa Hunt' },
];

export default function ClassRosterScreen() {
  const { classId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Students');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10B981';
    if (grade.startsWith('B')) return '#1E3A8A';
    if (grade.startsWith('C')) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Class Roster</Text>
          <TouchableOpacity style={styles.moreButton}><MoreVertical size={20} color="#FFFFFF" /></TouchableOpacity>
        </View>
        <Text style={styles.className}>Mathematics 101 - Section A</Text>
        <Text style={styles.classInfo}>32 students • Room 302</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Users size={20} color="#FFFFFF" /><Text style={styles.statValue}>32</Text><Text style={styles.statLabel}>Students</Text></View>
          <View style={styles.statBox}><TrendingUp size={20} color="#FFFFFF" /><Text style={styles.statValue}>B+</Text><Text style={styles.statLabel}>Avg Grade</Text></View>
          <View style={styles.statBox}><Text style={[styles.statValue, { color: '#10B981' }]}>91%</Text><Text style={styles.statLabel}>Attendance</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={20} color="#9CA3AF" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search students..." 
          value={searchQuery} 
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredStudents.map(student => (
          <TouchableOpacity key={student.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{student.name.split(' ').map(n => n[0]).join('')}</Text></View>
              <View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.parentName}>Parent: {student.parent}</Text>
                <View style={styles.contactRow}>
                  <TouchableOpacity style={styles.contactBtn}><Mail size={14} color="#1E3A8A" /></TouchableOpacity>
                  <TouchableOpacity style={styles.contactBtn}><Phone size={14} color="#1E3A8A" /></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.gradeBadge, { backgroundColor: `${getGradeColor(student.grade)}20` }]}>
                <Text style={[styles.gradeText, { color: getGradeColor(student.grade) }]}>{student.grade}</Text>
              </View>
              <Text style={styles.attendanceText}>{student.attendance}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  moreButton: { padding: 4 },
  className: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  classInfo: { fontSize: 14, color: '#93C5FD', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  tabContainer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8F7F5' },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF' },
  tabActive: { backgroundColor: '#1E3A8A' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 15 },
  content: { flex: 1, padding: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  studentName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  parentName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  contactBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  cardRight: { alignItems: 'flex-end' },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  gradeText: { fontSize: 13, fontWeight: '700' },
  attendanceText: { fontSize: 13, color: '#6B7280' },
});
