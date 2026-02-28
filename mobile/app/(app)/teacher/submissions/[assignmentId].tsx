import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, MessageSquare, ChevronRight } from 'lucide-react-native';

const RUBRIC = [
  { id: '1', criteria: 'Problem Understanding', points: 20, earned: 20 },
  { id: '2', criteria: 'Solution Approach', points: 30, earned: 28 },
  { id: '3', criteria: 'Calculations', points: 30, earned: 25 },
  { id: '4', criteria: 'Presentation', points: 20, earned: 18 },
];

export default function AssignmentSubmissionDetailScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const [grade, setGrade] = useState('91');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate assignmentId on mount
  useEffect(() => {
    if (!assignmentId) {
      Alert.alert('Error', 'Invalid assignment ID');
    }
  }, [assignmentId]);

  const handleSaveGrade = async () => {
    if (!assignmentId) return;
    
    setIsSubmitting(true);
    try {
      // TODO: API call to save grade
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Grade saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResubmit = () => {
    Alert.alert(
      'Request Resubmission',
      'Are you sure you want to request a resubmission from this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', style: 'destructive', onPress: () => Alert.alert('Requested', 'Resubmission requested.') }
      ]
    );
  };

  const totalPoints = RUBRIC.reduce((sum, r) => sum + r.points, 0);
  const earnedPoints = RUBRIC.reduce((sum, r) => sum + r.earned, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Submission</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>AJ</Text></View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>Alice Johnson</Text>
            <Text style={styles.studentMeta}>Grade 10 - Mathematics B</Text>
            <Text style={styles.submittedTime}>Submitted Oct 28, 2024 at 11:42 PM</Text>
          </View>
        </View>

        {/* Files Section */}
        <Text style={styles.sectionTitle}>Submitted Files</Text>
        <View style={styles.fileCard}>
          <View style={styles.fileIcon}><FileText size={24} color="#DC2626" /></View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>Calculus_HW3_Solutions.pdf</Text>
            <Text style={styles.fileSize}>2.4 MB</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn}><Download size={20} color="#1E3A8A" /></TouchableOpacity>
        </View>

        {/* Text Submission */}
        <Text style={styles.sectionTitle}>Submission Text</Text>
        <View style={styles.textCard}>
          <Text style={styles.submissionText}>
            I have completed all 15 problems from Chapter 4. For problem 12, I used the integration by parts method as discussed in class. I've also included a note about the alternative approach using substitution...
          </Text>
        </View>

        {/* Rubric */}
        <Text style={styles.sectionTitle}>Grading Rubric</Text>
        <View style={styles.rubricCard}>
          {RUBRIC.map(item => (
            <View key={item.id} style={styles.rubricItem}>
              <Text style={styles.rubricCriteria}>{item.criteria}</Text>
              <View style={styles.rubricInput}>
                <TextInput 
                  style={styles.pointsInput} 
                  value={item.earned.toString()} 
                  keyboardType="numeric"
                />
                <Text style={styles.rubricPoints}>/{item.points}</Text>
              </View>
            </View>
          ))}
          <View style={styles.rubricTotal}>
            <Text style={styles.rubricTotalLabel}>Total</Text>
            <Text style={styles.rubricTotalValue}>{earnedPoints}/{totalPoints}</Text>
          </View>
        </View>

        {/* Grade Input */}
        <Text style={styles.sectionTitle}>Final Grade</Text>
        <View style={styles.gradeCard}>
          <TextInput 
            style={styles.gradeInput} 
            value={grade} 
            onChangeText={setGrade}
            keyboardType="numeric"
          />
          <Text style={styles.gradePercent}>%</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeLetter}>A-</Text>
          </View>
        </View>

        {/* Feedback */}
        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.feedbackCard}>
          <TextInput 
            style={styles.feedbackInput}
            multiline
            numberOfLines={4}
            placeholder="Enter feedback for student..."
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.approveButton, isSubmitting && styles.approveButtonDisabled]} 
            onPress={handleSaveGrade}
            disabled={isSubmitting}
            accessibilityLabel="Save grade"
            accessibilityRole="button"
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.approveButtonText}>{isSubmitting ? 'Saving...' : 'Save Grade'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={handleRequestResubmit}
            accessibilityLabel="Request resubmission"
            accessibilityRole="button"
          >
            <XCircle size={20} color="#EF4444" />
            <Text style={styles.rejectButtonText}>Request Resubmit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  placeholder: { width: 32 },
  content: { flex: 1, padding: 16 },
  studentCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  studentInfo: { marginLeft: 12, flex: 1 },
  studentName: { fontSize: 17, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  studentMeta: { fontSize: 14, color: '#64748B', marginTop: 2, fontFamily: 'Inter' },
  submittedTime: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'Inter' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10, marginTop: 4, fontFamily: 'Inter' },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  fileIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  fileSize: { fontSize: 13, color: '#64748B', marginTop: 2, fontFamily: 'Inter' },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  textCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  submissionText: { fontSize: 14, color: '#374151', lineHeight: 20, fontFamily: 'Inter' },
  rubricCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  rubricItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rubricCriteria: { fontSize: 14, color: '#374151', fontWeight: '500', fontFamily: 'Inter' },
  rubricInput: { flexDirection: 'row', alignItems: 'center' },
  pointsInput: { width: 50, height: 36, backgroundColor: '#F3F4F6', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#0F172A' },
  rubricPoints: { fontSize: 14, color: '#64748B', marginLeft: 4, fontFamily: 'Inter' },
  rubricTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  rubricTotalLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  rubricTotalValue: { fontSize: 16, fontWeight: '700', color: '#1E3A8A', fontFamily: 'Inter' },
  gradeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  gradeInput: { width: 80, height: 50, backgroundColor: '#F3F4F6', borderRadius: 10, textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#0F172A' },
  gradePercent: { fontSize: 20, color: '#64748B', marginLeft: 4, fontFamily: 'Inter' },
  gradeBadge: { marginLeft: 'auto', backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  gradeLetter: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  feedbackCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  feedbackInput: { padding: 16, fontSize: 14, color: '#0F172A', lineHeight: 20, height: 100, textAlignVertical: 'top', fontFamily: 'Inter' },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14 },
  approveButtonDisabled: { backgroundColor: '#94A3B8' },
  approveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  rejectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#FECACA' },
  rejectButtonText: { fontSize: 15, fontWeight: '600', color: '#EF4444', fontFamily: 'Inter' },
});
