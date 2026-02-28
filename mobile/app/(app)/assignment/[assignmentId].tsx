import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Calendar,
  Paperclip,
  X,
  GraduationCap,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from '@/src/utils/date';

interface AssignmentDetail {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  points: number;
  earnedPoints?: number;
  submissionType: 'file' | 'text' | 'both';
  attachments: Attachment[];
  instructions: string;
  allowLateSubmission: boolean;
  maxAttempts: number;
  currentAttempt: number;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  attachments?: Attachment[];
  textContent?: string;
  grade?: {
    points: number;
    letterGrade: string;
    feedback: string;
  };
}

const fetchAssignment = async (assignmentId: string): Promise<AssignmentDetail> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    id: assignmentId,
    title: 'Calculus Problem Set - Chapter 5',
    courseId: '1',
    courseName: 'Advanced Mathematics',
    description: 'Complete all problems in Chapter 5, sections 5.1 through 5.4. Show all your work for full credit. This assignment covers limits, continuity, and introduction to derivatives.',
    dueDate: '2026-03-05T23:59:00',
    status: 'pending',
    points: 100,
    submissionType: 'both',
    attachments: [
      { id: '1', name: 'Chapter_5_Problems.pdf', size: 1250000, type: 'pdf', url: '#' },
      { id: '2', name: 'Formula_Sheet.pdf', size: 450000, type: 'pdf', url: '#' },
    ],
    instructions: 'Submit your work as a PDF or clear photos of handwritten solutions. Make sure your name is on every page. Late submissions will incur a 10% penalty per day.',
    allowLateSubmission: true,
    maxAttempts: 3,
    currentAttempt: 1,
  };
};

const fetchSubmissions = async (assignmentId: string): Promise<Submission[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return [
    {
      id: 's1',
      studentId: 'st1',
      studentName: 'Alex Johnson',
      submittedAt: '2026-03-05T20:30:00',
      status: 'graded',
      attachments: [{ id: 'a1', name: 'Alex_Johnson_HW5.pdf', size: 2100000, type: 'pdf', url: '#' }],
      grade: { points: 95, letterGrade: 'A', feedback: 'Excellent work! Minor error on problem 7.' },
    },
    {
      id: 's2',
      studentId: 'st2',
      studentName: 'Maria Garcia',
      submittedAt: '2026-03-05T22:15:00',
      status: 'submitted',
      attachments: [{ id: 'a2', name: 'Maria_Garcia_HW5.pdf', size: 1800000, type: 'pdf', url: '#' }],
    },
    {
      id: 's3',
      studentId: 'st3',
      studentName: 'James Wilson',
      submittedAt: '2026-03-05T21:45:00',
      status: 'graded',
      attachments: [{ id: 'a3', name: 'James_Wilson_HW5.pdf', size: 2500000, type: 'pdf', url: '#' }],
      grade: { points: 88, letterGrade: 'B+', feedback: 'Good effort. Review chain rule application.' },
    },
  ];
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getDaysUntil = (dateStr: string) => {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffMs < 0) return { text: 'Overdue', isUrgent: true };
  if (diffHours < 24) return { text: `Due in ${diffHours} hours`, isUrgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', isUrgent: true };
  return { text: `Due in ${diffDays} days`, isUrgent: false };
};

const LETTER_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export default function AssignmentDetailScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [textSubmission, setTextSubmission] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradePoints, setGradePoints] = useState('');
  const [gradeLetter, setGradeLetter] = useState('A');
  const [feedback, setFeedback] = useState('');

  const isTeacher = user?.role === 'teacher';

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => fetchSubmissions(assignmentId),
    enabled: isTeacher,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      Alert.alert('Success', 'Assignment submitted successfully!');
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      setShowGradingModal(false);
      Alert.alert('Success', 'Grade saved successfully!');
    },
  });

  const handleSubmit = () => {
    if (!textSubmission.trim() && uploadedFiles.length === 0) {
      Alert.alert('Error', 'Please add a submission before submitting.');
      return;
    }
    submitMutation.mutate();
  };

  const handleAddFile = () => {
    // Mock file upload
    const newFile: Attachment = {
      id: Date.now().toString(),
      name: `homework_solution_${uploadedFiles.length + 1}.pdf`,
      size: Math.floor(Math.random() * 5000000) + 500000,
      type: 'pdf',
      url: '#',
    };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradePoints(submission.grade?.points?.toString() || '');
    setGradeLetter(submission.grade?.letterGrade || 'A');
    setFeedback(submission.grade?.feedback || '');
    setShowGradingModal(true);
  };

  const dueInfo = assignment ? getDaysUntil(assignment.dueDate) : { text: '', isUrgent: false };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
      marginBottom: 12,
    },
    courseBadge: {
      alignSelf: 'flex-start',
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 12,
    },
    courseText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    urgentText: {
      color: colors.error,
      fontWeight: '600',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      padding: 20,
      paddingBottom: 100,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    instructions: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    attachmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundDark,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    attachmentIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachmentInfo: {
      flex: 1,
      marginLeft: 12,
    },
    attachmentName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    attachmentSize: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    attachmentActions: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 8,
    },
    uploadArea: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundDark,
    },
    uploadText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 8,
    },
    uploadSubtext: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    submissionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    submissionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    studentAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentInitials: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    submittedAt: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    gradeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    gradeText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    submissionActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
      flex: 1,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptySubmissions: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    // Grading Modal Styles
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
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    gradeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    gradeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gradeOption: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    gradeOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    gradeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    gradeOptionTextSelected: {
      color: '#fff',
    },
    feedbackInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
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
      marginTop: 20,
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

  if (assignmentLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.courseBadge} onPress={() => router.push(`/(app)/course/${assignment?.courseId}`)}>
            <Text style={styles.courseText}>{assignment?.courseName}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{assignment?.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={18} color={dueInfo.isUrgent ? colors.error : colors.textSecondary} />
              <Text style={[styles.metaText, dueInfo.isUrgent && styles.urgentText]}>
                {dueInfo.text}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <GraduationCap size={18} color={colors.textSecondary} />
              <Text style={styles.metaText}>{assignment?.points} points</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: assignment?.status === 'submitted' ? `${colors.success}20` : assignment?.status === 'graded' ? `${colors.primary}20` : `${colors.warning}20` }
            ]}>
              {assignment?.status === 'submitted' && <Check size={14} color={colors.success} />}
              {assignment?.status === 'graded' && <GraduationCap size={14} color={colors.primary} />}
              {assignment?.status === 'pending' && <Clock size={14} color={colors.warning} />}
              <Text style={[
                styles.statusText,
                { color: assignment?.status === 'submitted' ? colors.success : assignment?.status === 'graded' ? colors.primary : colors.warning }
              ]}>
                {assignment?.status === 'pending' ? 'Not Submitted' : assignment?.status ? assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{assignment?.description}</Text>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.instructions}>{assignment?.instructions}</Text>
          </View>

          {/* Attachments */}
          {assignment?.attachments && assignment.attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              {assignment.attachments.map((file) => (
                <View key={file.id} style={styles.attachmentItem}>
                  <View style={styles.attachmentIcon}>
                    <FileText size={20} color="#fff" />
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.attachmentSize}>{formatFileSize(file.size)}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconButton}>
                    <ArrowLeft size={20} color={colors.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Student Submission Section */}
          {!isTeacher && assignment?.status !== 'graded' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Submission</Text>
              
              {(assignment?.submissionType === 'text' || assignment?.submissionType === 'both') && (
                <TextInput
                  style={[styles.textInput, { marginBottom: 16 }]}
                  placeholder="Enter your submission text here..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={textSubmission}
                  onChangeText={setTextSubmission}
                />
              )}

              {(assignment?.submissionType === 'file' || assignment?.submissionType === 'both') && (
                <>
                  {uploadedFiles.map((file) => (
                    <View key={file.id} style={styles.attachmentItem}>
                      <View style={styles.attachmentIcon}>
                        <FileText size={20} color="#fff" />
                      </View>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                        <Text style={styles.attachmentSize}>{formatFileSize(file.size)}</Text>
                      </View>
                      <TouchableOpacity style={styles.iconButton} onPress={() => handleRemoveFile(file.id)}>
                        <X size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.uploadArea} onPress={handleAddFile}>
                    <Upload size={32} color={colors.primary} />
                    <Text style={styles.uploadText}>Upload File</Text>
                    <Text style={styles.uploadSubtext}>PDF, DOC, or images up to 10MB</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Assignment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Graded View for Student */}
          {!isTeacher && assignment?.status === 'graded' && assignment?.earnedPoints && (
            <View style={[
              styles.section,
              { backgroundColor: `${colors.success}10`, borderColor: colors.success }
            ]}>
              <Text style={styles.sectionTitle}>Your Grade</Text>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.success }}>
                  {assignment.earnedPoints}/{assignment.points}
                </Text>
                <Text style={{ fontSize: 18, color: colors.textSecondary, marginTop: 8 }}>
                  Great work!
                </Text>
              </View>
            </View>
          )}

          {/* Teacher Submissions View */}
          {isTeacher && (
            <>
              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Users size={24} color={colors.primary} />
                  <Text style={styles.statValue}>{submissions?.length || 0}</Text>
                  <Text style={styles.statLabel}>Submitted</Text>
                </View>
                <View style={styles.statCard}>
                  <Check size={24} color={colors.success} />
                  <Text style={styles.statValue}>
                    {submissions?.filter(s => s.status === 'graded').length || 0}
                  </Text>
                  <Text style={styles.statLabel}>Graded</Text>
                </View>
                <View style={styles.statCard}>
                  <Clock size={24} color={colors.warning} />
                  <Text style={styles.statValue}>
                    {(submissions?.filter(s => s.status === 'submitted').length || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              {/* Submissions List */}
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Submissions</Text>
              {submissionsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : submissions && submissions.length > 0 ? (
                submissions.map((submission) => (
                  <View key={submission.id} style={styles.submissionCard}>
                    <View style={styles.submissionHeader}>
                      <View style={styles.studentInfo}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentInitials}>{submission.studentName.charAt(0)}</Text>
                        </View>
                        <View>
                          <Text style={styles.studentName}>{submission.studentName}</Text>
                          <Text style={styles.submittedAt}>
                            {format(parseISO(submission.submittedAt), 'MMM d, h:mm a')}
                          </Text>
                        </View>
                      </View>
                      {submission.grade && (
                        <View style={[styles.gradeBadge, { backgroundColor: `${colors.success}20` }]}>
                          <Text style={[styles.gradeText, { color: colors.success }]}>
                            {submission.grade.letterGrade}
                          </Text>
                        </View>
                      )}
                    </View>

                    {submission.grade?.feedback && (
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                        "{submission.grade.feedback}"
                      </Text>
                    )}

                    <View style={styles.submissionActions}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.backgroundDark }]}>
                        <FileText size={16} color={colors.textSecondary} />
                        <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => openGradingModal(submission)}
                      >
                        <GraduationCap size={16} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                          {submission.grade ? 'Edit Grade' : 'Grade'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptySubmissions}>
                  <FileText size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No submissions yet</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
