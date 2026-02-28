import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Plus, Megaphone, Clock, ChevronRight, Trash2, Edit3 } from 'lucide-react-native';

const ANNOUNCEMENTS = [
  { id: '1', title: 'School Closure - Weather Alert', message: 'School will be closed tomorrow due to severe weather conditions...', audience: 'All', date: 'Oct 28, 2024', status: 'sent', priority: 'high' },
  { id: '2', title: 'New Library Hours', message: 'The school library will now be open until 6 PM on weekdays...', audience: 'Students', date: 'Oct 25, 2024', status: 'sent', priority: 'normal' },
  { id: '3', title: 'Parent-Teacher Conferences', message: 'Sign up for parent-teacher conferences next week...', audience: 'Parents', date: 'Oct 20, 2024', status: 'draft', priority: 'normal' },
];

const AUDIENCES = ['All', 'Teachers', 'Students', 'Parents'];

export default function SystemAnnouncementsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['All']);
  const [isHighPriority, setIsHighPriority] = useState(false);

  const toggleAudience = (audience: string) => {
    if (audience === 'All') {
      setSelectedAudiences(['All']);
    } else {
      setSelectedAudiences(prev => {
        const filtered = prev.filter(a => a !== 'All');
        if (prev.includes(audience)) {
          return filtered.filter(a => a !== audience);
        }
        return [...filtered, audience];
      });
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
          <Text style={styles.headerTitle}>Announcements</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(!showCreate)}>
            {showCreate ? <Text style={styles.cancelText}>Cancel</Text> : <Plus size={24} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showCreate ? (
          /* Create Form */
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Announcement</Text>
            
            <Text style={styles.label}>Title</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter announcement title..."
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Enter your message..."
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
            />

            <Text style={styles.label}>Target Audience</Text>
            <View style={styles.audienceRow}>
              {AUDIENCES.map(audience => (
                <TouchableOpacity 
                  key={audience} 
                  style={[styles.audienceChip, selectedAudiences.includes(audience) && styles.audienceChipActive]}
                  onPress={() => toggleAudience(audience)}
                >
                  <Text style={[styles.audienceChipText, selectedAudiences.includes(audience) && styles.audienceChipTextActive]}>{audience}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>High Priority</Text>
                <Text style={styles.switchSubtext}>This will send push notifications</Text>
              </View>
              <Switch value={isHighPriority} onValueChange={setIsHighPriority} trackColor={{ false: '#D1D5DB', true: '#EF4444' }} />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.draftButton}>
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendButton}>
                <Megaphone size={18} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Announcements List */
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Total Sent</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Drafts</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Announcements</Text>
            {ANNOUNCEMENTS.map(ann => (
              <View key={ann.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.titleRow}>
                    {ann.priority === 'high' && <View style={styles.priorityBadge}><Text style={styles.priorityText}>HIGH</Text></View>}
                    <Text style={styles.announcementTitle} numberOfLines={1}>{ann.title}</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, ann.status === 'sent' ? styles.statusSent : styles.statusDraft]}>
                      <Text style={[styles.statusText, ann.status === 'sent' ? styles.statusSentText : styles.statusDraftText]}>{ann.status}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.announcementMessage} numberOfLines={2}>{ann.message}</Text>
                <View style={styles.announcementFooter}>
                  <View style={styles.audienceBadge}>
                    <Megaphone size={12} color="#1E3A8A" />
                    <Text style={styles.audienceText}>{ann.audience}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.dateText}>{ann.date}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn}><Edit3 size={16} color="#64748B" /></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
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
  addButton: { padding: 4, minWidth: 32 },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  content: { flex: 1, padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16, fontFamily: 'Inter' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12, fontFamily: 'Inter' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontFamily: 'Inter' },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 12 },
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  audienceChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  audienceChipActive: { backgroundColor: '#1E3A8A' },
  audienceChipText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  audienceChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  switchSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontFamily: 'Inter' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  draftButton: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#64748B', fontFamily: 'Inter' },
  sendButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E3A8A', borderRadius: 10, paddingVertical: 12 },
  sendButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 4, fontFamily: 'Inter' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12, fontFamily: 'Inter' },
  announcementCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  priorityBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  announcementTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1, fontFamily: 'Inter' },
  statusRow: { marginLeft: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusSent: { backgroundColor: '#F0FDF4' },
  statusDraft: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', fontFamily: 'Inter' },
  statusSentText: { color: '#10B981' },
  statusDraftText: { color: '#6B7280' },
  announcementMessage: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12, fontFamily: 'Inter' },
  announcementFooter: { flexDirection: 'row', alignItems: 'center' },
  audienceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  audienceText: { fontSize: 12, color: '#1E3A8A', fontWeight: '500', fontFamily: 'Inter' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 },
  dateText: { fontSize: 12, color: '#94A3B8', fontFamily: 'Inter' },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  actionBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
});
