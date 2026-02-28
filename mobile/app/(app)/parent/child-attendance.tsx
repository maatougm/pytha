import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

const STATS = [
  { label: 'Present', value: '92%', color: '#10B981' },
  { label: 'Absences', value: '2', color: '#EF4444' },
  { label: 'Tardies', value: '3', color: '#F59E0B' },
];

export default function ChildAttendanceScreen() {
  const [selectedMonth, setSelectedMonth] = useState('October 2024');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Child Attendance</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity><ChevronLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.monthText}>{selectedMonth}</Text>
          <TouchableOpacity><ChevronRight size={24} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Attendance Calendar</Text>
          {/* Simplified calendar view */}
          <View style={styles.calendarGrid}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
            {Array.from({length: 31}, (_, i) => i + 1).map((day) => {
              const status = day % 7 === 0 ? 'absent' : day % 5 === 0 ? 'late' : 'present';
              const colors = { present: '#10B981', absent: '#EF4444', late: '#F59E0B' };
              return (
                <View key={day} style={styles.dayCell}>
                  <Text style={styles.dayText}>{day}</Text>
                  <View style={[styles.statusDot, { backgroundColor: colors[status as keyof typeof colors] }]} />
                </View>
              );
            })}
          </View>
        </View>
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
  placeholder: { width: 32 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  calendarTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9CA3AF', paddingVertical: 8 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 4 },
  dayText: { fontSize: 14, color: '#1F2937' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});
