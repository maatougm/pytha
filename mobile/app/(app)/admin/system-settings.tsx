import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Bell, Shield, Users, Globe, Moon, ChevronRight, LogOut } from 'lucide-react-native';

export default function SystemSettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* System Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>All Systems Operational</Text>
              <Text style={styles.statusSubtitle}>Last updated: 2 minutes ago</Text>
            </View>
          </View>
        </View>

        {/* General Settings */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}><Globe size={20} color="#1E3A8A" /><Text style={styles.menuText}>Language</Text></View>
            <View style={styles.menuRight}><Text style={styles.menuValue}>English (US)</Text><ChevronRight size={18} color="#9CA3AF" /></View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}><Moon size={20} color="#1E3A8A" /><Text style={styles.menuText}>Dark Mode</Text></View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}><Bell size={20} color="#1E3A8A" /><Text style={styles.menuText}>Push Notifications</Text></View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }} />
          </View>
        </View>

        {/* Security */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}><Shield size={20} color="#1E3A8A" /><Text style={styles.menuText}>Security Settings</Text></View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}><Users size={20} color="#1E3A8A" /><Text style={styles.menuText}>User Permissions</Text></View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Maintenance */}
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View><Text style={styles.menuText}>Maintenance Mode</Text><Text style={styles.menuSubtext}>Temporarily disable non-admin access</Text></View>
            <Switch value={maintenance} onValueChange={setMaintenance} trackColor={{ false: '#D1D5DB', true: '#F59E0B' }} />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Version</Text><Text style={styles.infoValue}>2.4.1</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Build</Text><Text style={styles.infoValue}>2847</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Environment</Text><Text style={styles.infoValue}>Production</Text></View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', marginRight: 12 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  statusSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 8 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  menuSubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuValue: { fontSize: 14, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, marginBottom: 30 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
