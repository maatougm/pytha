import React from 'react';
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Plus,
} from 'lucide-react-native';

const TODAY_SESSIONS = [
  {
    id: '1',
    className: 'Mathematics 101',
    time: '09:00 AM - 10:30 AM',
    room: 'Room 302',
    students: 28,
    status: 'completed',
    attended: 26,
  },
  {
    id: '2',
    className: 'Advanced Calculus',
    time: '11:00 AM - 12:30 PM',
    room: 'Room 205',
    students: 22,
    status: 'in_progress',
    attended: 20,
  },
  {
    id: '3',
    className: 'Geometry',
    time: '02:00 PM - 03:30 PM',
    room: 'Room 301',
    students: 30,
    status: 'not_started',
    attended: 0,
  },
  {
    id: '4',
    className: 'Algebra II',
    time: '04:00 PM - 05:30 PM',
    room: 'Room 204',
    students: 25,
    status: 'not_started',
    attended: 0,
  },
];

const STATS = [
  { label: 'Total Sessions', value: '4', icon: Calendar },
  { label: 'Avg. Attendance', value: '94%', icon: Users },
];

export default function AttendanceSessionsScreen() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'not_started':
        return '#9CA3AF';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
      default:
        return status;
    }
  };

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'completed':
        return 'View Report';
      case 'in_progress':
        return 'Take Attendance';
      case 'not_started':
        return 'Start Session';
      default:
        return 'View';
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
          <Text style={styles.headerTitle}>Attendance Sessions</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity>
            <ChevronRight size={24} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.dateInfo}>
            <Calendar size={18} color="#93C5FD" />
            <Text style={styles.dateText}>Monday, October 26, 2024</Text>
          </View>
          <TouchableOpacity>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <stat.icon size={24} color="#1E3A8A" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Sessions</Text>
          {TODAY_SESSIONS.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.className}>{session.className}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(session.status)}20` },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(session.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(session.status) },
                    ]}
                  >
                    {getStatusLabel(session.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{session.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{session.room}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {session.status === 'completed'
                      ? `${session.attended}/${session.students} attended`
                      : `${session.students} students`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: getStatusColor(session.status) },
                ]}
              >
                <Text style={styles.actionButtonText}>
                  {getStatusAction(session.status)}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
