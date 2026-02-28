import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  ChevronRight,
} from 'lucide-react-native';

const FILTER_CHIPS = ['All', 'Documents', 'Videos', 'Images', 'Audio'];

const FOLDERS = [
  { id: '1', name: 'Week 1 - Introduction', count: 5 },
  { id: '2', name: 'Week 2 - Algebra Basics', count: 8 },
  { id: '3', name: 'Week 3 - Equations', count: 6 },
  { id: '4', name: 'Practice Problems', count: 12 },
  { id: '5', name: 'Exam Preparation', count: 4 },
];

const FILES = [
  {
    id: '1',
    name: 'Course_Syllabus_2024.pdf',
    type: 'pdf',
    size: '2.4 MB',
    date: 'Sep 1, 2024',
    iconColor: '#EF4444',
  },
  {
    id: '2',
    name: 'Lecture_1_Slides.pptx',
    type: 'doc',
    size: '5.1 MB',
    date: 'Sep 2, 2024',
    iconColor: '#F59E0B',
  },
  {
    id: '3',
    name: 'Introduction_Video.mp4',
    type: 'video',
    size: '45 MB',
    date: 'Sep 3, 2024',
    iconColor: '#8B5CF6',
  },
  {
    id: '4',
    name: 'Formula_Sheet.pdf',
    type: 'pdf',
    size: '1.2 MB',
    date: 'Sep 5, 2024',
    iconColor: '#EF4444',
  },
  {
    id: '5',
    name: 'Practice_Problems_Set_1.pdf',
    type: 'pdf',
    size: '3.8 MB',
    date: 'Sep 8, 2024',
    iconColor: '#EF4444',
  },
];

export default function CourseResourcesScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getFileIcon = (type: string, color: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
        return <FileText size={24} color={color} />;
      case 'image':
        return <ImageIcon size={24} color={color} />;
      case 'video':
        return <Video size={24} color={color} />;
      default:
        return <FileText size={24} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Resources</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>Advanced Mathematics</Text>
          <Text style={styles.courseTeacher}>Ms. Sarah Johnson</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[
                styles.filterChip,
                activeFilter === chip && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(chip)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === chip && styles.filterChipTextActive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Folders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Folders</Text>
          {FOLDERS.map((folder) => (
            <TouchableOpacity key={folder.id} style={styles.folderCard}>
              <View style={styles.folderIcon}>
                <Folder size={32} color="#F59E0B" fill="#F59E0B" />
              </View>
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderCount}>{folder.count} files</Text>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Files Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Files</Text>
          {FILES.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={[styles.fileIcon, { backgroundColor: `${file.iconColor}15` }]}>
                {getFileIcon(file.type, file.iconColor)}
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {file.size} • {file.date}
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Download size={20} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 32,
  },
  courseInfo: {
    marginBottom: 16,
  },
  courseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  courseTeacher: {
    fontSize: 14,
    color: '#93C5FD',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  downloadButton: {
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
