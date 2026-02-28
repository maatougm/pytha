import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Plus, Users, Clock, MapPin, ChevronRight } from 'lucide-react-native';

const CLASSES = [
  { id: '1', name: 'Mathematics 101 - A', course: 'Mathematics', teacher: 'Ms. Sarah Johnson', schedule: 'Mon/Wed 9:00 AM', room: '302', enrolled: 28, capacity: 30, status: 'active' },
  { id: '2', name: 'Physics - B', course: 'Physics', teacher: 'Mr. David Chen', schedule: 'Tue/Thu 11:00 AM', room: '205', enrolled: 22, capacity: 25, status: 'active' },
  { id: '3', name: 'English Lit - A', course: 'English', teacher: 'Mrs. Emily Davis', schedule: 'Mon/Fri 2:00 PM', room: '105', enrolled: 30, capacity: 30, status: 'full' },
];

export default function ClassManagementScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Class Management</Text>
          <TouchableOpacity style={styles.addButton}><Plus size={24} color="#FFFFFF" /></TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNumber}>12</Text><Text style={styles.statLabel}>Total Classes</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>10</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>312</Text><Text style={styles.statLabel}>Students</Text></View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {CLASSES.map(cls => (
          <TouchableOpacity key={cls.id} style={styles.classCard}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{cls.name}</Text>
              <View style={[styles.statusBadge, cls.status === 'full' ? styles.statusFull : styles.statusActive]}>
                <Text style={[styles.statusText, cls.status === 'full' ? styles.statusTextFull : styles.statusTextActive]}>
                  {cls.status === 'full' ? 'Full' : 'Active'}
                </Text>
              </View>
            </View>
            <Text style={styles.classCourse}>{cls.course}</Text>
            <View style={styles.detailsRow}>
              <View style={styles.detail}><Clock size={14} color="#6B7280" /><Text style={styles.detailText}>{cls.schedule}</Text></View>
              <View style={styles.detail}><MapPin size={14} color="#6B7280" /><Text style={styles.detailText}>Room {cls.room}</Text></View>
            </View>
            <View style={styles.footer}>
              <View style={styles.teacherRow}><Text style={styles.teacherLabel}>Teacher:</Text><Text style={styles.teacherName}>{cls.teacher}</Text></View>
              <View style={styles.enrollmentRow}><Users size={14} color="#1E3A8A" /><Text style={styles.enrollmentText}>{cls.enrolled}/{cls.capacity}</Text></View>
            </View>
            <ChevronRight size={20} color="#D1D5DB" style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: '#93C5FD', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  className: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusActive: { backgroundColor: '#F0FDF4' },
  statusFull: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextActive: { color: '#10B981' },
  statusTextFull: { color: '#F59E0B' },
  classCourse: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#6B7280' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  teacherRow: { flexDirection: 'row', gap: 4 },
  teacherLabel: { fontSize: 13, color: '#9CA3AF' },
  teacherName: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  enrollmentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enrollmentText: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  chevron: { position: 'absolute', right: 16, top: '50%', marginTop: -10 },
});
