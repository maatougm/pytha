import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react-native';

const CHILDREN = [
  { id: '1', name: 'Alice Johnson', grade: 'Grade 10', avatar: 'AJ' },
  { id: '2', name: 'Tom Johnson', grade: 'Grade 8', avatar: 'TJ' },
];

const GRADES = [
  { course: 'Mathematics', grade: 'A', percentage: 95, trend: 'up', teacher: 'Ms. Sarah Johnson', color: '#10B981' },
  { course: 'Physics', grade: 'A-', percentage: 92, trend: 'up', teacher: 'Mr. David Chen', color: '#10B981' },
  { course: 'English', grade: 'B+', percentage: 88, trend: 'down', teacher: 'Mrs. Emily Davis', color: '#3B82F6' },
  { course: 'History', grade: 'A', percentage: 94, trend: 'stable', teacher: 'Mr. James Wilson', color: '#10B981' },
];

export default function ChildGradesScreen() {
  const [selectedChild, setSelectedChild] = useState(CHILDREN[0]);
  const [showDropdown, setShowDropdown] = useState(false);

  const getTrendIcon = (trend: string, color: string) => {
    if (trend === 'up') return <TrendingUp size={16} color="#10B981" />;
    if (trend === 'down') return <TrendingDown size={16} color="#EF4444" />;
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Child Grades</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Child Selector */}
        <TouchableOpacity style={styles.childSelector} onPress={() => setShowDropdown(!showDropdown)}>
          <View style={styles.childAvatar}><Text style={styles.childAvatarText}>{selectedChild.avatar}</Text></View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{selectedChild.name}</Text>
            <Text style={styles.childGrade}>{selectedChild.grade}</Text>
          </View>
          <ChevronDown size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdown}>
            {CHILDREN.map((child) => (
              <TouchableOpacity key={child.id} style={styles.dropdownItem} onPress={() => { setSelectedChild(child); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>{child.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* GPA Summary */}
        <View style={styles.gpaCard}>
          <View>
            <Text style={styles.gpaLabel}>Current GPA</Text>
            <Text style={styles.gpaValue}>3.75</Text>
            <Text style={styles.gpaMax}>out of 4.0</Text>
          </View>
          <View style={styles.gpaTrend}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.gpaChange}>+0.15</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Course Grades</Text>
        {GRADES.map((item, index) => (
          <TouchableOpacity key={index} style={styles.gradeCard}>
            <View style={styles.gradeHeader}>
              <View>
                <Text style={styles.courseName}>{item.course}</Text>
                <Text style={styles.teacherName}>{item.teacher}</Text>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.gradeText, { color: item.color }]}>{item.grade}</Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
              <View style={styles.percentageRow}>
                {getTrendIcon(item.trend, item.color)}
                <Text style={styles.percentageText}>{item.percentage}%</Text>
              </View>
            </View>
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
  placeholder: { width: 32 },
  childSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginBottom: 16 },
  childAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  childInfo: { flex: 1, marginLeft: 12 },
  childName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  childGrade: { fontSize: 14, color: '#93C5FD' },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownText: { fontSize: 16, color: '#1F2937' },
  gpaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  gpaLabel: { fontSize: 14, color: '#6B7280' },
  gpaValue: { fontSize: 36, fontWeight: '700', color: '#1F2937' },
  gpaMax: { fontSize: 14, color: '#9CA3AF' },
  gpaTrend: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  gpaChange: { fontSize: 14, fontWeight: '600', color: '#10B981', marginLeft: 4 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  gradeCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  courseName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  teacherName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  gradeText: { fontSize: 16, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  percentageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  percentageText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
});
