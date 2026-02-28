import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';

const STATS = [
  { label: 'Present', value: '92%', color: '#10B981', count: 23 },
  { label: 'Absent', value: '2 days', color: '#EF4444', count: 2 },
  { label: 'Late', value: '3 days', color: '#F59E0B', count: 3 },
  { label: 'Excused', value: '1 day', color: '#3B82F6', count: 1 },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate calendar data for October 2024
const CALENDAR_DAYS = [
  { date: 29, month: 'prev', status: null },
  { date: 30, month: 'prev', status: null },
  { date: 1, month: 'current', status: 'present' },
  { date: 2, month: 'current', status: 'present' },
  { date: 3, month: 'current', status: 'late' },
  { date: 4, month: 'current', status: 'present' },
  { date: 5, month: 'current', status: 'present' },
  { date: 6, month: 'current', status: null },
  { date: 7, month: 'current', status: 'present' },
  { date: 8, month: 'current', status: 'present' },
  { date: 9, month: 'current', status: 'absent' },
  { date: 10, month: 'current', status: 'present' },
  { date: 11, month: 'current', status: 'present' },
  { date: 12, month: 'current', status: 'present' },
  { date: 13, month: 'current', status: null },
  { date: 14, month: 'current', status: 'present' },
  { date: 15, month: 'current', status: 'late' },
  { date: 16, month: 'current', status: 'present' },
  { date: 17, month: 'current', status: 'present' },
  { date: 18, month: 'current', status: 'excused' },
  { date: 19, month: 'current', status: 'present' },
  { date: 20, month: 'current', status: null },
  { date: 21, month: 'current', status: 'present' },
  { date: 22, month: 'current', status: 'present' },
  { date: 23, month: 'current', status: 'present' },
  { date: 24, month: 'current', status: 'absent' },
  { date: 25, month: 'current', status: 'present' },
  { date: 26, month: 'current', status: 'present' },
  { date: 27, month: 'current', status: null },
  { date: 28, month: 'current', status: 'present' },
  { date: 29, month: 'current', status: 'present' },
  { date: 30, month: 'current', status: 'present' },
  { date: 31, month: 'current', status: 'present' },
  { date: 1, month: 'next', status: null },
  { date: 2, month: 'next', status: null },
];

const RECENT_ABSENCES = [
  { date: 'Oct 24, 2024', reason: 'Sick leave', status: 'absent' },
  { date: 'Oct 9, 2024', reason: 'Family emergency', status: 'absent' },
  { date: 'Oct 18, 2024', reason: 'School event', status: 'excused' },
];

export default function MyAttendanceScreen() {
  const [selectedMonth, setSelectedMonth] = useState('October 2024');

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return '#10B981';
      case 'absent':
        return '#EF4444';
      case 'late':
        return '#F59E0B';
      case 'excused':
        return '#3B82F6';
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'absent':
        return 'Absent';
      case 'excused':
        return 'Excused';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{selectedMonth}</Text>
          <TouchableOpacity>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statCount}>{stat.count} days</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Week Days Header */}
          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {CALENDAR_DAYS.map((day, index) => {
              const statusColor = getStatusColor(day.status);
              const isToday = day.date === 26 && day.month === 'current';

              return (
                <View key={index} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayContent,
                      isToday && styles.todayCell,
                      day.month !== 'current' && styles.otherMonth,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        day.month !== 'current' && styles.otherMonthText,
                      ]}
                    >
                      {day.date}
                    </Text>
                    {statusColor && (
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Excused</Text>
            </View>
          </View>
        </View>

        {/* Recent Absences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Absences</Text>
          {RECENT_ABSENCES.map((absence, index) => (
            <View key={index} style={styles.absenceCard}>
              <View style={styles.absenceInfo}>
                <Text style={styles.absenceDate}>{absence.date}</Text>
                <Text style={styles.absenceReason}>{absence.reason}</Text>
              </View>
              <View
                style={[
                  styles.absenceBadge,
                  {
                    backgroundColor:
                      absence.status === 'absent' ? '#FEE2E2' : '#DBEAFE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.absenceBadgeText,
                    {
                      color: absence.status === 'absent' ? '#EF4444' : '#3B82F6',
                    },
                  ]}
                >
                  {getStatusLabel(absence.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 32,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  statCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  otherMonth: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  todayText: {
    fontWeight: '700',
    color: '#F59E0B',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  absenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  absenceInfo: {
    flex: 1,
  },
  absenceDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  absenceReason: {
    fontSize: 14,
    color: '#6B7280',
  },
  absenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  absenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
