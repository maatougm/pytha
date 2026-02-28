import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Send, Mail, User, CheckCircle, Clock, XCircle } from 'lucide-react-native';

const ROLES = ['Student', 'Teacher', 'Parent', 'Admin'];

const INVITATIONS = [
  { id: '1', email: 'john.smith@email.com', role: 'Teacher', date: 'Oct 25, 2024', status: 'pending' },
  { id: '2', email: 'mary.jones@email.com', role: 'Parent', date: 'Oct 24, 2024', status: 'accepted' },
  { id: '3', email: 'peter.wang@email.com', role: 'Student', date: 'Oct 20, 2024', status: 'expired' },
];

export default function UserInvitationsScreen() {
  const [selectedRole, setSelectedRole] = useState('Student');
  const [email, setEmail] = useState('');

  const getStatusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={18} color="#10B981" />;
    if (status === 'pending') return <Clock size={18} color="#F59E0B" />;
    return <XCircle size={18} color="#EF4444" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>User Invitations</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invite Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send New Invitation</Text>
          
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map(role => (
              <TouchableOpacity key={role} style={[styles.roleChip, selectedRole === role && styles.roleChipActive]} onPress={() => setSelectedRole(role)}>
                <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.emailInput}>
            <Mail size={20} color="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Enter email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>

          <TouchableOpacity style={styles.sendButton}>
            <Send size={18} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Send Invitation</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNumber}>24</Text><Text style={styles.statLabel}>Sent</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>18</Text><Text style={styles.statLabel}>Accepted</Text></View>
          <View style={styles.statBox}><Text style={styles.statNumber}>4</Text><Text style={styles.statLabel}>Pending</Text></View>
        </View>

        {/* Recent Invitations */}
        <Text style={styles.sectionTitle}>Recent Invitations</Text>
        {INVITATIONS.map(inv => (
          <View key={inv.id} style={styles.inviteCard}>
            <View style={styles.inviteIcon}><User size={20} color="#1E3A8A" /></View>
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteEmail}>{inv.email}</Text>
              <Text style={styles.inviteMeta}>{inv.role} • {inv.date}</Text>
            </View>
            <View style={styles.inviteStatus}>
              {getStatusIcon(inv.status)}
              <Text style={[styles.statusText, inv.status === 'accepted' ? styles.statusAccepted : inv.status === 'pending' ? styles.statusPending : styles.statusExpired]}>
                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  placeholder: { width: 32 },
  content: { flex: 1, padding: 16 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  roleChipActive: { backgroundColor: '#1E3A8A' },
  roleChipText: { fontSize: 14, color: '#6B7280' },
  roleChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  emailInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  input: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15 },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E3A8A', borderRadius: 10, paddingVertical: 12 },
  sendButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  inviteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  inviteInfo: { flex: 1, marginLeft: 12 },
  inviteEmail: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  inviteMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  inviteStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13, fontWeight: '500' },
  statusAccepted: { color: '#10B981' },
  statusPending: { color: '#F59E0B' },
  statusExpired: { color: '#EF4444' },
});
