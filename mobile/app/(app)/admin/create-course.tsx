import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Switch, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Upload, Plus, X, ChevronDown } from 'lucide-react-native';

const DEPARTMENTS = ['Mathematics', 'Science', 'English', 'History', 'Arts', 'PE'];
const GRADE_LEVELS = ['9', '10', '11', '12'];

export default function CreateCourseScreen() {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [teachers, setTeachers] = useState(['Ms. Sarah Johnson']);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    } else if (courseName.trim().length < 3) {
      newErrors.courseName = 'Course name must be at least 3 characters';
    }
    
    if (!courseCode.trim()) {
      newErrors.courseCode = 'Course code is required';
    } else if (!/^[A-Z]{2,4}-\d{3}$/i.test(courseCode.trim())) {
      newErrors.courseCode = 'Course code should be like MATH-301';
    }
    
    if (credits && (isNaN(Number(credits)) || Number(credits) < 0 || Number(credits) > 10)) {
      newErrors.credits = 'Credits must be between 0 and 10';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // TODO: API call to create course
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Course created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Create Course</Text>
          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Upload */}
        <TouchableOpacity style={styles.uploadArea}>
          <Upload size={32} color="#64748B" />
          <Text style={styles.uploadText}>Tap to upload course image</Text>
          <Text style={styles.uploadSubtext}>Recommended: 1200x600px</Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Course Name *</Text>
          <TextInput 
            style={[styles.input, errors.courseName && styles.inputError]} 
            placeholder="e.g., Advanced Calculus"
            value={courseName}
            onChangeText={(text) => {
              setCourseName(text);
              if (errors.courseName) setErrors(prev => ({ ...prev, courseName: '' }));
            }}
          />
          {errors.courseName && <Text style={styles.errorText}>{errors.courseName}</Text>}

          <Text style={styles.label}>Course Code *</Text>
          <TextInput 
            style={[styles.input, errors.courseCode && styles.inputError]} 
            placeholder="e.g., MATH-301"
            value={courseCode}
            onChangeText={(text) => {
              setCourseCode(text);
              if (errors.courseCode) setErrors(prev => ({ ...prev, courseCode: '' }));
            }}
            autoCapitalize="characters"
          />
          {errors.courseCode && <Text style={styles.errorText}>{errors.courseCode}</Text>}

          <Text style={styles.label}>Department</Text>
          <View style={styles.selectRow}>
            {DEPARTMENTS.map(dept => (
              <TouchableOpacity 
                key={dept} 
                style={[styles.deptChip, selectedDepartment === dept && styles.deptChipActive]}
                onPress={() => setSelectedDepartment(dept)}
              >
                <Text style={[styles.deptChipText, selectedDepartment === dept && styles.deptChipTextActive]}>{dept}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Grade Levels</Text>
          <View style={styles.gradeRow}>
            {GRADE_LEVELS.map(grade => (
              <TouchableOpacity 
                key={grade} 
                style={[styles.gradeChip, selectedGrades.includes(grade) && styles.gradeChipActive]}
                onPress={() => toggleGrade(grade)}
              >
                <Text style={[styles.gradeChipText, selectedGrades.includes(grade) && styles.gradeChipTextActive]}>Grade {grade}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Credit Hours</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., 3"
            keyboardType="numeric"
            value={credits}
            onChangeText={setCredits}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Enter course description..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Assigned Teachers</Text>
          <View style={styles.teachersContainer}>
            {teachers.map((teacher, index) => (
              <View key={index} style={styles.teacherChip}>
                <Text style={styles.teacherChipText}>{teacher}</Text>
                <TouchableOpacity><X size={14} color="#64748B" /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addTeacherBtn}>
              <Plus size={16} color="#1E3A8A" />
              <Text style={styles.addTeacherText}>Add Teacher</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active Course</Text>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishButton}>
            <Text style={styles.publishButtonText}>Publish Course</Text>
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
  saveButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  saveButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  content: { flex: 1, padding: 16 },
  uploadArea: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', padding: 30, alignItems: 'center', marginBottom: 16 },
  uploadText: { fontSize: 15, fontWeight: '500', color: '#374151', marginTop: 12, fontFamily: 'Inter' },
  uploadSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'Inter' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12, fontFamily: 'Inter' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontFamily: 'Inter' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, fontFamily: 'Inter' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  deptChipActive: { backgroundColor: '#1E3A8A' },
  deptChipText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  deptChipTextActive: { color: '#FFFFFF', fontWeight: '500' },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  gradeChipActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  gradeChipText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  gradeChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  teachersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  teacherChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  teacherChipText: { fontSize: 13, color: '#1E3A8A', fontFamily: 'Inter' },
  addTeacherBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1E3A8A', borderStyle: 'dashed' },
  addTeacherText: { fontSize: 13, color: '#1E3A8A', fontFamily: 'Inter' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#0F172A', fontFamily: 'Inter' },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  draftButton: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#64748B', fontFamily: 'Inter' },
  publishButton: { flex: 1, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  publishButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
});
