import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Search, Plus, MoreVertical, BookOpen } from 'lucide-react-native';

const COURSES = [
  { id: '1', name: 'Mathematics 101', code: 'MATH101', department: 'Mathematics', grades: '9-12', classes: 5, active: true },
  { id: '2', name: 'Physics', code: 'PHYS201', department: 'Science', grades: '10-12', classes: 3, active: true },
  { id: '3', name: 'English Literature', code: 'ENG301', department: 'English', grades: '9-12', classes: 6, active: true },
  { id: '4', name: 'Chemistry', code: 'CHEM101', department: 'Science', grades: '10-12', classes: 2, active: false },
];

export default function CourseManagementScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState(COURSES);

  const toggleActive = (id: string) => {
    setCourses(courses.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Course Management</Text>
          <TouchableOpacity style={styles.addButton}><Plus size={24} color="#FFFFFF" /></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{courses.length}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{courses.filter(c => c.active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9CA3AF" />
          <TextInput style={styles.searchInput} placeholder="Search courses..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {courses.map(course => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseIcon}><BookOpen size={24} color="#1E3A8A" /></View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseCode}>{course.code} • {course.department}</Text>
                <Text style={styles.courseMeta}>Grades {course.grades} • {course.classes} classes</Text>
              </View>
              <View style={styles.courseActions}>
                <Switch value={course.active} onValueChange={() => toggleActive(course.id)} trackColor={{ false: '#D1D5DB', true: '#10B981' }} />
                <TouchableOpacity style={styles.moreButton}><MoreVertical size={20} color="#6B7280" /></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  addButton: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 13, color: '#93C5FD', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  courseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  courseIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  courseInfo: { flex: 1, marginLeft: 12 },
  courseName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  courseCode: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  courseMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  courseActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moreButton: { padding: 8 },
});
