import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Check,
  X,
  AlertCircle,
  Clock4,
  FileText,
  ChevronDown,
  Save,
  MoreVertical,
  BookOpen,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from '@/src/utils/date';

interface Class {
  id: string;
  name: string;
  courseName: string;
  schedule: string;
  room: string;
  totalStudents: number;
}

interface Student {
  id: string;
  name: string;
  avatar?: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
  note: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

const CLASSES: Class[] = [
  { id: '1', name: '10A - Mathematics', courseName: 'Advanced Mathematics', schedule: '10:00 AM', room: 'Room 302', totalStudents: 28 },
  { id: '2', name: '10B - Physics', courseName: 'Physics', schedule: '11:30 AM', room: 'Lab 101', totalStudents: 26 },
  { id: '3', name: '9A - English', courseName: 'English Literature', schedule: '9:00 AM', room: 'Room 205', totalStudents: 30 },
  { id: '4', name: '11A - Chemistry', courseName: 'Chemistry', schedule: '2:00 PM', room: 'Lab 301', totalStudents: 24 },
];

const fetchStudents = async (classId: string): Promise<Student[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { id: 's1', name: 'Alex Johnson', rollNumber: '1001', status: null, note: '' },
    { id: 's2', name: 'Maria Garcia', rollNumber: '1002', status: null, note: '' },
    { id: 's3', name: 'James Wilson', rollNumber: '1003', status: null, note: '' },
    { id: 's4', name: 'Emma Brown', rollNumber: '1004', status: null, note: '' },
    { id: 's5', name: 'Michael Chen', rollNumber: '1005', status: null, note: '' },
    { id: 's6', name: 'Sophie Davis', rollNumber: '1006', status: null, note: '' },
    { id: 's7', name: 'William Taylor', rollNumber: '1007', status: null, note: '' },
    { id: 's8', name: 'Olivia Martinez', rollNumber: '1008', status: null, note: '' },
    { id: 's9', name: 'Daniel Anderson', rollNumber: '1009', status: null, note: '' },
    { id: 's10', name: 'Isabella Thomas', rollNumber: '1010', status: null, note: '' },
  ];
};

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  present: {
    label: 'Present',
    color: '#10b981',
    icon: <Check size={14} color="#fff" />,
  },
  absent: {
    label: 'Absent',
    color: '#ef4444',
    icon: <X size={14} color="#fff" />,
  },
  late: {
    label: 'Late',
    color: '#f59e0b',
    icon: <Clock4 size={14} color="#fff" />,
  },
  excused: {
    label: 'Excused',
    color: '#6b7280',
    icon: <FileText size={14} color="#fff" />,
  },
};

export default function AttendanceMarkingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<Class>(CLASSES[0]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [noteText, setNoteText] = useState('');

  const { isLoading, refetch, data: studentsData } = useQuery({
    queryKey: ['attendance-students', selectedClass.id],
    queryFn: () => fetchStudents(selectedClass.id),
  });

  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData);
    }
  }, [studentsData]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      Alert.alert('Success', 'Attendance saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance-students', selectedClass.id] });
    },
  });

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const updateStudentNote = (studentId: string, note: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, note } : s
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const handleOpenNoteModal = (student: Student) => {
    setSelectedStudent(student);
    setNoteText(student.note);
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (selectedStudent) {
      updateStudentNote(selectedStudent.id, noteText);
      setShowNoteModal(false);
      setSelectedStudent(null);
      setNoteText('');
    }
  };

  const stats: AttendanceStats = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    excused: students.filter(s => s.status === 'excused').length,
    total: students.length,
  };

  const markedCount = students.filter(s => s.status !== null).length;
  const progress = stats.total > 0 ? (markedCount / stats.total) * 100 : 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    // Class Selector
    classSelector: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    classButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundDark,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    classIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    classInfo: {
      flex: 1,
    },
    className: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    classMeta: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    // Dropdown
    dropdown: {
      position: 'absolute',
      top: 70,
      left: 16,
      right: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 100,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemSelected: {
      backgroundColor: `${colors.primary}10`,
    },
    // Date Bar
    dateBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    bulkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.success}15`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    bulkButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
    },
    // Progress Bar
    progressContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      color: colors.text,
    },
    progressPercent: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.backgroundDark,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    // Stats Preview
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    statBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // Student List
    listContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    studentItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    studentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    studentAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.backgroundDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentInitials: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    studentInfo: {
      flex: 1,
      marginLeft: 12,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    studentRoll: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    noteButton: {
      padding: 8,
    },
    hasNote: {
      backgroundColor: `${colors.warning}15`,
      borderRadius: 8,
    },
    statusButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    statusButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 4,
    },
    statusButtonActive: {
      borderColor: 'transparent',
    },
    statusButtonInactive: {
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    statusButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    noteText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    // Empty State
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    // Bottom Bar
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      padding: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    // Note Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    noteInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: colors.backgroundDark,
    },
    modalButtonSave: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Class Selector */}
        <View style={styles.classSelector}>
          <TouchableOpacity 
            style={styles.classButton}
            onPress={() => setShowClassDropdown(!showClassDropdown)}
          >
            <View style={styles.classIcon}>
              <BookOpen size={22} color="#fff" />
            </View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{selectedClass.name}</Text>
              <Text style={styles.classMeta}>
                {selectedClass.schedule} • {selectedClass.room} • {selectedClass.totalStudents} students
              </Text>
            </View>
            <ChevronDown size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {showClassDropdown && (
            <View style={styles.dropdown}>
              {CLASSES.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.dropdownItem,
                    selectedClass.id === cls.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedClass(cls);
                    setShowClassDropdown(false);
                  }}
                >
                  <View style={[styles.classIcon, { width: 36, height: 36 }]}>
                    <BookOpen size={18} color="#fff" />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classMeta}>
                      {cls.schedule} • {cls.room}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date Bar */}
        <View style={styles.dateBar}>
          <View style={styles.dateItem}>
            <Calendar size={18} color={colors.primary} />
            <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
          </View>
          <TouchableOpacity style={styles.bulkButton} onPress={markAllPresent}>
            <Check size={16} color={colors.success} />
            <Text style={styles.bulkButtonText}>Mark All Present</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Attendance Progress</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Stats Preview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBadge, { backgroundColor: `${colors.success}20` }]}>
            <Check size={14} color={colors.success} />
            <Text style={[styles.statBadgeText, { color: colors.success }]}>{stats.present}</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: `${colors.error}20` }]}>
            <X size={14} color={colors.error} />
            <Text style={[styles.statBadgeText, { color: colors.error }]}>{stats.absent}</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: `${colors.warning}20` }]}>
            <Clock4 size={14} color={colors.warning} />
            <Text style={[styles.statBadgeText, { color: colors.warning }]}>{stats.late}</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: `${colors.textMuted}20` }]}>
            <FileText size={14} color={colors.textMuted} />
            <Text style={[styles.statBadgeText, { color: colors.textMuted }]}>{stats.excused}</Text>
          </View>
        </View>

        {/* Student List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            students.map((student) => (
              <View key={student.id} style={styles.studentItem}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentInitials}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>Roll #{student.rollNumber}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.noteButton, student.note && styles.hasNote]}
                    onPress={() => handleOpenNoteModal(student)}
                  >
                    <FileText size={18} color={student.note ? colors.warning : colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.statusButtons}>
                  {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const isSelected = student.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          isSelected ? styles.statusButtonActive : styles.statusButtonInactive,
                          isSelected && { backgroundColor: config.color },
                        ]}
                        onPress={() => updateStudentStatus(student.id, status)}
                      >
                        {isSelected && config.icon}
                        <Text style={[
                          styles.statusButtonText,
                          { color: isSelected ? '#fff' : colors.textSecondary },
                        ]}>
                          {config.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {student.note && (
                  <Text style={styles.noteText}>Note: {student.note}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Submit Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                Save Attendance ({markedCount}/{stats.total})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNoteModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Enter note..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={noteText}
              onChangeText={setNoteText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveNote}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
