import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';

const TABS = ['Upcoming', 'Overdue', 'Completed'];

const ASSIGNMENTS = [
  { id: '1', title: 'Math Homework - Chapter 5', course: 'Mathematics', dueDate: '2 days', status: 'upcoming', grade: null },
  { id: '2', title: 'Physics Lab Report', course: 'Physics', dueDate: 'Tomorrow', status: 'upcoming', grade: null },
  { id: '3', title: 'History Essay', course: 'History', dueDate: 'Yesterday', status: 'overdue', grade: null },
  { id: '4', title: 'English Reading', course: 'English', dueDate: 'Oct 20', status: 'completed', grade: '92%' },
];

export default function ChildAssignmentsScreen() {
  const [activeTab, setActiveTab] = useState('Upcoming');

  const filtered = ASSIGNMENTS.filter(a => a.status.toLowerCase() === activeTab.toLowerCase());

  const getStatusIcon = (status: string) => {
    if (status === 'upcoming') return <Clock size={18} color="#3B82F6" />;
    if (status === 'overdue') return <AlertCircle size={18} color="#EF4444" />;
    return <CheckCircle size={18} color="#10B981" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Child Assignments</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {filtered.map(assignment => (
          <View key={assignment.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {getStatusIcon(assignment.status)}
              <Text style={styles.dueDate}>{assignment.dueDate}</Text>
            </View>
            <Text style={styles.title}>{assignment.title}</Text>
            <Text style={styles.course}>{assignment.course}</Text>
            {assignment.grade && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>Grade: {assignment.grade}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  placeholder: { width: 32 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1E3A8A' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dueDate: { fontSize: 13, color: '#6B7280' },
  title: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  course: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  gradeBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  gradeText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
});
