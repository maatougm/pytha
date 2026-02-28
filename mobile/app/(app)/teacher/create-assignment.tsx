import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Paperclip, Plus, ChevronDown, X } from 'lucide-react-native';
import { createAssignment } from '@/src/services/grading.service';

const COURSES = ['Mathematics 101', 'Physics A', 'Chemistry Honors', 'English Literature'];
const ASSIGNMENT_TYPES = ['Homework', 'Quiz', 'Project', 'Essay', 'Lab Report'];

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('Mathematics 101');
  const [selectedType, setSelectedType] = useState('Homework');
  const [points, setPoints] = useState('100');
  const [allowLate, setAllowLate] = useState(true);
  const [peerReview, setPeerReview] = useState(false);
  const [attachments, setAttachments] = useState(['Worksheet.pdf']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Assignment title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!points.trim()) {
      newErrors.points = 'Points are required';
    } else {
      const pointsNum = parseInt(points, 10);
      if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 1000) {
        newErrors.points = 'Points must be between 0 and 1000';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before publishing.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Find a mock classId based on selected course, or default to a static one
      const courseIndex = COURSES.indexOf(selectedCourse);
      const classId = `class-${courseIndex + 1}`; // Simple mock mapping

      // Map selectedType to backend type
      let apiType: 'homework' | 'quiz' | 'exam' | 'project' | 'participation' | 'other' = 'homework';
      const lowercaseType = selectedType.toLowerCase();
      if (['homework', 'quiz', 'project', 'other'].includes(lowercaseType)) {
        apiType = lowercaseType as any;
      } else if (lowercaseType === 'lab report' || lowercaseType === 'essay') {
        apiType = 'project';
      }

      await createAssignment(classId, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: apiType,
        maxPoints: parseInt(points, 10),
        allowLateSubmission: allowLate,
        isPublished: true,
        // Since we don't have a real date picker in the UI right now, we omit dueDate for now
        // or we could hardcode one if required, but it is optional according to types.
      });

      Alert.alert('Success', 'Assignment published successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to publish assignment. Please try again.');
      console.error('Failed to create assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Assignment saved as draft.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Create Assignment</Text>
          <TouchableOpacity 
            style={[styles.postButton, isSubmitting && styles.postButtonDisabled]} 
            onPress={handlePublish}
            disabled={isSubmitting}
            accessibilityLabel="Publish assignment"
            accessibilityRole="button"
          >
            <Text style={styles.postButtonText}>{isSubmitting ? 'Publishing...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Assignment Title *</Text>
          <TextInput 
            style={[styles.input, errors.title && styles.inputError]} 
            placeholder="e.g., Calculus Homework #3"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            accessibilityLabel="Assignment title"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={styles.label}>Course *</Text>
          <View style={styles.selectContainer}>
            <Text style={styles.selectText}>{selectedCourse}</Text>
            <ChevronDown size={20} color="#64748B" />
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Enter assignment instructions..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Due Date *</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Calendar size={18} color="#64748B" />
                <Text style={styles.dateText}>Oct 30, 2024</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Clock size={18} color="#64748B" />
                <Text style={styles.dateText}>11:59 PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Assignment Type</Text>
          <View style={styles.typeRow}>
            {ASSIGNMENT_TYPES.map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Points *</Text>
          <TextInput 
            style={[styles.input, errors.points && styles.inputError]} 
            keyboardType="numeric"
            value={points}
            onChangeText={(text) => {
              setPoints(text);
              if (errors.points) setErrors(prev => ({ ...prev, points: '' }));
            }}
            accessibilityLabel="Assignment points"
          />
          {errors.points && <Text style={styles.errorText}>{errors.points}</Text>}

          {/* Attachments */}
          <Text style={styles.label}>Attachments</Text>
          <View style={styles.attachmentsContainer}>
            {attachments.map((file, index) => (
              <View key={index} style={styles.attachmentChip}>
                <Paperclip size={14} color="#1E3A8A" />
                <Text style={styles.attachmentText}>{file}</Text>
                <TouchableOpacity><X size={14} color="#64748B" /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addAttachmentBtn}>
              <Plus size={16} color="#1E3A8A" />
              <Text style={styles.addAttachmentText}>Add File</Text>
            </TouchableOpacity>
          </View>

          {/* Toggles */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Allow Late Submissions</Text>
                <Text style={styles.toggleSubtext}>Students can submit after deadline with penalty</Text>
              </View>
              <Switch value={allowLate} onValueChange={setAllowLate} trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }} />
            </View>
            <View style={[styles.toggleRow, styles.toggleLast]}>
              <View>
                <Text style={styles.toggleLabel}>Enable Peer Review</Text>
                <Text style={styles.toggleSubtext}>Students review each other&apos;s work</Text>
              </View>
              <Switch value={peerReview} onValueChange={setPeerReview} trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.draftButton} 
            onPress={handleSaveDraft}
            accessibilityLabel="Save as draft"
            accessibilityRole="button"
          >
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]} 
            onPress={handlePublish}
            disabled={isSubmitting}
            accessibilityLabel="Publish assignment"
            accessibilityRole="button"
          >
            <Text style={styles.publishButtonText}>{isSubmitting ? 'Publishing...' : 'Publish Assignment'}</Text>
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
  postButton: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F59E0B', borderRadius: 8 },
  postButtonDisabled: { backgroundColor: '#94A3B8' },
  postButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  content: { flex: 1, padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12, fontFamily: 'Inter' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontFamily: 'Inter' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, fontFamily: 'Inter' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  selectContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  selectText: { fontSize: 15, color: '#0F172A', fontFamily: 'Inter' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: '#E2E8F0' },
  dateText: { fontSize: 15, color: '#0F172A', fontFamily: 'Inter' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  typeChipActive: { backgroundColor: '#1E3A8A' },
  typeChipText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  typeChipTextActive: { color: '#FFFFFF', fontWeight: '500' },
  attachmentsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  attachmentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  attachmentText: { fontSize: 13, color: '#1E3A8A', fontFamily: 'Inter' },
  addAttachmentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1E3A8A', borderStyle: 'dashed' },
  addAttachmentText: { fontSize: 13, color: '#1E3A8A', fontFamily: 'Inter' },
  toggleSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleLast: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#0F172A', fontFamily: 'Inter' },
  toggleSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontFamily: 'Inter' },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  draftButton: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#64748B', fontFamily: 'Inter' },
  publishButton: { flex: 1, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  publishButtonDisabled: { backgroundColor: '#94A3B8' },
  publishButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
});
