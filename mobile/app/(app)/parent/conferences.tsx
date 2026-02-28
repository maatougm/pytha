import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  Clock as ClockIcon,
  X,
  ChevronRight,
  User,
  BookOpen,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/providers/ThemeProvider';
import { useParent } from '@/src/hooks/useParent';
import { useConferences, useTeacherCommunication } from '@/src/hooks/useParent';
import { Header } from '@/src/components/Header';
import { Card } from '@/src/components/Card';

export default function ConferencesScreen() {
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const { selectedChild } = useParent();
  const { conferences, isLoading, scheduleConference, confirmConference, cancelConference, refresh } =
    useConferences(selectedChild?.id);
  const { teachers } = useTeacherCommunication(selectedChild?.id || '');

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<typeof teachers[0] | null>(null);
  const [proposedDates, setProposedDates] = useState<Date[]>([]);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSchedule = async () => {
    if (!selectedTeacher || !selectedChild || proposedDates.length === 0) {
      Alert.alert('Missing Information', 'Please select a teacher and at least one preferred date');
      return;
    }

    const result = await scheduleConference(
      selectedTeacher.id,
      selectedChild.id,
      proposedDates,
      notes
    );

    if (result.success) {
      Alert.alert('Request Sent', 'The teacher will confirm one of your proposed dates', [
        { text: 'OK', onPress: () => {
          setShowScheduleModal(false);
          resetForm();
        }},
      ]);
    } else {
      Alert.alert('Failed', result.error || 'Could not schedule conference');
    }
  };

  const resetForm = () => {
    setSelectedTeacher(null);
    setProposedDates([]);
    setNotes('');
  };

  const addDate = (date: Date) => {
    if (proposedDates.length < 3) {
      setProposedDates([...proposedDates, date]);
    }
  };

  const removeDate = (index: number) => {
    setProposedDates(proposedDates.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    // Schedule Button
    scheduleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    scheduleButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.primaryForeground,
    },
    // Section
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.lg,
      color: colors.text,
      marginBottom: spacing.md,
    },
    // Conference Card
    conferenceCard: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    conferenceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    teacherInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    teacherAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    teacherName: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    teacherSubject: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    statusText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      textTransform: 'capitalize',
    },
    conferenceDetails: {
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    conferenceActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonSecondary: {
      backgroundColor: colors.backgroundSecondary,
    },
    actionButtonDanger: {
      backgroundColor: colors.error + '20',
    },
    actionButtonText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.xl,
      color: colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Teacher Selection
    teacherSelection: {
      marginBottom: spacing.lg,
    },
    selectionLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    teacherList: {
      gap: spacing.sm,
    },
    teacherOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 2,
    },
    teacherOptionSelected: {
      borderColor: colors.primary,
    },
    teacherOptionUnselected: {
      borderColor: colors.border,
    },
    // Date Selection
    dateSelection: {
      marginBottom: spacing.lg,
    },
    selectedDates: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    dateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
    },
    dateChipText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
    addDateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
    },
    addDateText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.primary,
    },
    // Notes Input
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSizes.base,
      color: colors.text,
      backgroundColor: colors.background,
      height: 100,
      textAlignVertical: 'top',
    },
    // Submit Button
    submitButton: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitButtonText: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.base,
      color: colors.primaryForeground,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Parent-Teacher Conferences" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Schedule Button */}
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => setShowScheduleModal(true)}
        >
          <Calendar size={20} color={colors.primaryForeground} />
          <Text style={styles.scheduleButtonText}>Schedule New Conference</Text>
        </TouchableOpacity>

        {/* Upcoming Conferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Conferences</Text>

          {conferences
            .filter(c => c.status === 'confirmed' || c.status === 'pending')
            .map(conference => (
              <Card key={conference.id} style={styles.conferenceCard}>
                <View style={styles.conferenceHeader}>
                  <View style={styles.teacherInfo}>
                    <View style={styles.teacherAvatar}>
                      <User size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.teacherName}>{conference.teacherName}</Text>
                      <Text style={styles.teacherSubject}>{conference.teacherSubject}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(conference.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(conference.status) },
                      ]}
                    >
                      {conference.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.conferenceDetails}>
                  {conference.selectedDate ? (
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {new Date(conference.selectedDate).toLocaleString()}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.detailRow}>
                      <ClockIcon size={16} color={colors.warning} />
                      <Text style={styles.detailText}>
                        Waiting for teacher to confirm date
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{conference.duration} minutes</Text>
                  </View>

                  {conference.meetingLink && (
                    <View style={styles.detailRow}>
                      <Video size={16} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.primary }]}>
                        Video conference link available
                      </Text>
                    </View>
                  )}
                </View>

                {conference.status === 'confirmed' && (
                  <View style={styles.conferenceActions}>
                    {conference.meetingLink && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => {/* Open meeting link */}}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
                          Join Meeting
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => {
                        Alert.alert(
                          'Cancel Conference',
                          'Are you sure you want to cancel this conference?',
                          [
                            { text: 'No', style: 'cancel' },
                            {
                              text: 'Yes',
                              style: 'destructive',
                              onPress: () => cancelConference(conference.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}

          {conferences.filter(c => c.status === 'confirmed' || c.status === 'pending').length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming conferences</Text>
            </View>
          )}
        </View>

        {/* Past Conferences */}
        {conferences.filter(c => c.status === 'completed' || c.status === 'cancelled').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Conferences</Text>

            {conferences
              .filter(c => c.status === 'completed' || c.status === 'cancelled')
              .map(conference => (
                <Card key={conference.id} style={styles.conferenceCard}>
                  <View style={styles.conferenceHeader}>
                    <View style={styles.teacherInfo}>
                      <View style={styles.teacherAvatar}>
                        <User size={20} color={colors.textMuted} />
                      </View>
                      <View>
                        <Text style={styles.teacherName}>{conference.teacherName}</Text>
                        <Text style={styles.teacherSubject}>{conference.teacherSubject}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(conference.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(conference.status) },
                        ]}
                      >
                        {conference.status}
                      </Text>
                    </View>
                  </View>

                  {conference.selectedDate && (
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>
                        {new Date(conference.selectedDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowScheduleModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Conference</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowScheduleModal(false);
                  resetForm();
                }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Teacher Selection */}
            <View style={styles.teacherSelection}>
              <Text style={styles.selectionLabel}>Select Teacher</Text>
              <View style={styles.teacherList}>
                {teachers.map(teacher => (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[
                      styles.teacherOption,
                      selectedTeacher?.id === teacher.id
                        ? styles.teacherOptionSelected
                        : styles.teacherOptionUnselected,
                    ]}
                    onPress={() => setSelectedTeacher(teacher)}
                  >
                    <View style={styles.teacherAvatar}>
                      <User size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherName}>{teacher.name}</Text>
                      <Text style={styles.teacherSubject}>{teacher.subject}</Text>
                    </View>
                    {selectedTeacher?.id === teacher.id && (
                      <CheckCircle size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.dateSelection}>
              <Text style={styles.selectionLabel}>
                Preferred Dates (up to 3)
              </Text>
              
              <View style={styles.selectedDates}>
                {proposedDates.map((date, index) => (
                  <View key={index} style={styles.dateChip}>
                    <Text style={styles.dateChipText}>
                      {date.toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => removeDate(index)}>
                      <X size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {proposedDates.length < 3 && (
                <TouchableOpacity
                  style={styles.addDateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={colors.primary} />
                  <Text style={styles.addDateText}>Add Date & Time</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notes */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={styles.selectionLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="What would you like to discuss?"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSchedule}>
              <Text style={styles.submitButtonText}>Send Request</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                addDate(date);
              }
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}
