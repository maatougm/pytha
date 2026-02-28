import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Upload, Download, FileText, CheckCircle, AlertCircle, XCircle, ChevronDown } from 'lucide-react-native';

const ROLES = ['Student', 'Teacher', 'Parent'];

const PREVIEW_DATA = [
  { id: '1', name: 'John Smith', email: 'john.smith@school.com', role: 'Student', grade: 'Grade 10', status: 'valid' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@school.com', role: 'Teacher', department: 'Mathematics', status: 'valid' },
  { id: '3', name: 'Mike Brown', email: 'mike.brown', role: 'Student', grade: 'Grade 11', status: 'error' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@school.com', role: 'Parent', status: 'valid' },
];

export default function BulkUserImportScreen() {
  const [selectedRole, setSelectedRole] = useState('Student');
  const [fileSelected, setFileSelected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validCount = PREVIEW_DATA.filter(d => d.status === 'valid').length;
  const errorCount = PREVIEW_DATA.filter(d => d.status === 'error').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Bulk Import</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Download Template */}
        <View style={styles.templateCard}>
          <View style={styles.templateIcon}><Download size={24} color="#1E3A8A" /></View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateTitle}>Download Template</Text>
            <Text style={styles.templateSubtext}>Get the CSV format for bulk import</Text>
          </View>
          <TouchableOpacity style={styles.templateButton}>
            <Text style={styles.templateButtonText}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Role Selector */}
        <Text style={styles.sectionTitle}>Import Role</Text>
        <View style={styles.roleRow}>
          {ROLES.map(role => (
            <TouchableOpacity 
              key={role} 
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>{role}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* File Upload */}
        <Text style={styles.sectionTitle}>Upload File</Text>
        {!fileSelected ? (
          <TouchableOpacity style={styles.uploadArea} onPress={() => setFileSelected(true)}>
            <Upload size={40} color="#64748B" />
            <Text style={styles.uploadText}>Tap to upload CSV or Excel file</Text>
            <Text style={styles.uploadSubtext}>Max file size: 5MB</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}><FileText size={24} color="#1E3A8A" /></View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>students_import_2024.csv</Text>
              <Text style={styles.fileSize}>245 KB • 4 users</Text>
              {uploadProgress < 100 && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setFileSelected(false)}><XCircle size={20} color="#EF4444" /></TouchableOpacity>
          </View>
        )}

        {/* Preview Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{PREVIEW_DATA.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, styles.statValid]}>
            <Text style={[styles.statNumber, styles.statValidText]}>{validCount}</Text>
            <Text style={[styles.statLabel, styles.statValidText]}>Valid</Text>
          </View>
          <View style={[styles.statBox, styles.statError]}>
            <Text style={[styles.statNumber, styles.statErrorText]}>{errorCount}</Text>
            <Text style={[styles.statLabel, styles.statErrorText]}>Errors</Text>
          </View>
        </View>

        {/* Data Preview */}
        <Text style={styles.sectionTitle}>Data Preview</Text>
        <View style={styles.previewCard}>
          {PREVIEW_DATA.map((row, index) => (
            <View key={row.id} style={[styles.previewRow, index !== PREVIEW_DATA.length - 1 && styles.previewRowBorder]}>
              <View style={styles.previewLeft}>
                <Text style={styles.previewName}>{row.name}</Text>
                <Text style={styles.previewEmail}>{row.email}</Text>
                <Text style={styles.previewMeta}>{row.role} • {row.grade || row.department}</Text>
              </View>
              {row.status === 'valid' ? (
                <CheckCircle size={20} color="#10B981" />
              ) : (
                <View style={styles.errorBadge}>
                  <AlertCircle size={14} color="#FFFFFF" />
                  <Text style={styles.errorText}>Invalid email</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.importButton, errorCount > 0 && styles.importButtonDisabled]} disabled={errorCount > 0}>
            <Text style={styles.importButtonText}>Import {validCount} Users</Text>
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
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  templateIcon: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  templateInfo: { flex: 1, marginLeft: 12 },
  templateTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  templateSubtext: { fontSize: 13, color: '#64748B', marginTop: 2, fontFamily: 'Inter' },
  templateButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1E3A8A', borderRadius: 8 },
  templateButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 8, fontFamily: 'Inter' },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  roleChipActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  roleChipText: { fontSize: 14, color: '#64748B', fontFamily: 'Inter' },
  roleChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  uploadArea: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', padding: 40, alignItems: 'center', marginBottom: 16 },
  uploadText: { fontSize: 15, fontWeight: '500', color: '#374151', marginTop: 12, fontFamily: 'Inter' },
  uploadSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'Inter' },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  fileIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  fileSize: { fontSize: 13, color: '#64748B', marginTop: 2, fontFamily: 'Inter' },
  progressBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statValid: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  statValidText: { color: '#10B981' },
  statErrorText: { color: '#EF4444' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: 'Inter' },
  previewCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  previewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  previewRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  previewLeft: { flex: 1 },
  previewName: { fontSize: 14, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  previewEmail: { fontSize: 13, color: '#64748B', marginTop: 1, fontFamily: 'Inter' },
  previewMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: 'Inter' },
  errorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  errorText: { fontSize: 11, color: '#FFFFFF', fontWeight: '500', fontFamily: 'Inter' },
  actionButtons: { marginBottom: 30 },
  importButton: { backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  importButtonDisabled: { backgroundColor: '#94A3B8' },
  importButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
});
