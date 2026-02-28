import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Image } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, MoreVertical, Search, FileText, Image as ImageIcon, Folder, ChevronRight, Plus } from 'lucide-react-native';

const FILTERS = ['All', 'PDFs', 'Images', 'Docs'];

const FILES = [
  { id: '1', name: 'Calculus_Syllabus_2024.pdf', size: '2.4 MB', date: 'Today, 10:30 AM', type: 'pdf' },
  { id: '2', name: 'Algebra_Homework_WK3.docx', size: '845 KB', date: 'Yesterday', type: 'doc' },
  { id: '3', name: 'Whiteboard_Notes_01.jpg', size: '1.2 MB', date: 'Oct 24', type: 'image' },
  { id: '4', name: 'Trigonometry_Review.pptx', size: '5.8 MB', date: 'Oct 20', type: 'slides' },
  { id: '5', name: 'Previous Semesters', size: '12 items', date: 'Sep 15', type: 'folder' },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <View style={[styles.fileIcon, { backgroundColor: '#FEF2F2' }]}><FileText size={24} color="#DC2626" /></View>;
    case 'doc':
      return <View style={[styles.fileIcon, { backgroundColor: '#EFF6FF' }]}><FileText size={24} color="#2563EB" /></View>;
    case 'image':
      return <Image source={{ uri: 'https://picsum.photos/48/48' }} style={[styles.fileIcon, { backgroundColor: '#F3F4F6' }]} />;
    case 'slides':
      return <View style={[styles.fileIcon, { backgroundColor: '#FFF7ED' }]}><FileText size={24} color="#EA580C" /></View>;
    case 'folder':
      return <View style={[styles.fileIcon, { backgroundColor: '#FEFCE8' }]}><Folder size={24} color="#CA8A04" /></View>;
    default:
      return <View style={[styles.fileIcon, { backgroundColor: '#F3F4F6' }]}><FileText size={24} color="#6B7280" /></View>;
  }
};

export default function FileManagerScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconButton}><ArrowLeft size={24} color="#0F172A" /></TouchableOpacity>
          <Text style={styles.headerTitle}>File Manager</Text>
          <TouchableOpacity style={styles.iconButton}><MoreVertical size={24} color="#0F172A" /></TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput style={styles.searchInput} placeholder="Search files..." placeholderTextColor="#64748B" />
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
              accessibilityLabel={`Filter by ${filter}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Breadcrumbs */}
        <View style={styles.breadcrumbs}>
          <Text style={styles.breadcrumbItem}>Home</Text>
          <ChevronRight size={16} color="#64748B" />
          <Text style={styles.breadcrumbItem}>Math</Text>
          <ChevronRight size={16} color="#64748B" />
          <Text style={styles.breadcrumbActive}>Docs</Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        {/* File List */}
        <View style={styles.fileList}>
          {FILES.map(file => (
            <View key={file.id} style={styles.fileCard}>
              <TouchableOpacity style={styles.fileInfoContainer} activeOpacity={0.7}>
                {getFileIcon(file.type)}
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileMetaText}>{file.size}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.fileMetaText}>{file.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {file.type === 'folder' ? <ChevronRight size={20} color="#94A3B8" /> : <MoreVertical size={20} color="#94A3B8" />}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} accessibilityLabel="Upload file" accessibilityRole="button">
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0F172A', fontFamily: 'Inter' },
  filterContainer: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#1E3A8A' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#475569', fontFamily: 'Inter' },
  filterChipTextActive: { color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  breadcrumbItem: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  breadcrumbActive: { fontSize: 13, color: '#0F172A', fontWeight: '600', fontFamily: 'Inter' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', fontFamily: 'Inter' },
  viewAll: { fontSize: 12, color: '#64748B', fontWeight: '500', fontFamily: 'Inter' },
  fileList: { gap: 12 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  fileInfoContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  fileIcon: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
  fileMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fileMetaText: { fontSize: 12, color: '#64748B', fontFamily: 'Inter' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
  moreButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 100, width: 56, height: 56, borderRadius: 28, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
