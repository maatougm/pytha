import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Search,
  Mic,
  ChevronRight,
  FileText,
  User,
  BookOpen,
  MessageCircle,
  X,
} from 'lucide-react-native';

const FILTER_CHIPS = ['All', 'Courses', 'People', 'Files', 'Events'];

// Mock search results
const SEARCH_RESULTS = {
  courses: [
    {
      id: '1',
      name: 'Advanced Mathematics',
      match: 'Mathem',
      grade: 'Grade 12 • Room 302',
      badge: 'Required',
      badgeColor: '#F59E0B',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=100&h=100&fit=crop',
    },
    {
      id: '2',
      name: 'Basic Mathematics',
      match: 'Mathem',
      grade: 'Grade 9 • Room 104',
      badge: 'Elective',
      badgeColor: '#10B981',
      image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=100&h=100&fit=crop',
    },
  ],
  people: [
    {
      id: '1',
      name: 'Sarah Matheson',
      match: 'Mathem',
      role: 'Teacher',
      roleColor: '#3B82F6',
      department: 'Head of Science Dept.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      id: '2',
      name: 'John Mathem',
      match: 'Mathem',
      role: 'Student',
      roleColor: '#F59E0B',
      department: 'Grade 11B',
      initials: 'JM',
    },
  ],
  files: [
    {
      id: '1',
      name: 'Mathematics_Syllabus_2024.pdf',
      match: 'Mathem',
      size: '2.4 MB',
      date: 'Oct 12',
      type: 'pdf',
      iconColor: '#EF4444',
    },
    {
      id: '2',
      name: 'Project_Mathem_Proposal.docx',
      match: 'Mathem',
      size: '145 KB',
      date: 'Just now',
      type: 'doc',
      iconColor: '#3B82F6',
    },
  ],
};

const RECENT_SEARCHES = ['Mathematics', 'Science Project', 'Parent Meeting'];

export default function GlobalSearchScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('Mathem');
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  const removeRecentSearch = (search: string) => {
    setRecentSearches(recentSearches.filter(s => s !== search));
  };

  const highlightMatch = (text: string, match: string) => {
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <Text key={`match-${index}`} style={styles.highlight}>{part}</Text>
      ) : (
        <Text key={`text-${index}`}>{part}</Text>
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7F5" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header & Search */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.backButton}>
            <Search size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses, people..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.micButton}>
              <Mic size={20} color="#F59E0B" fill="#F59E0B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

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
              accessibilityLabel={`Filter by ${chip}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === chip }}
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

        {/* Recent Searches */}
        {searchQuery === '' && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recent</Text>
            <View style={styles.recentChips}>
              {recentSearches.map((search) => (
                <View key={search} style={styles.recentChip}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => setSearchQuery(search)}
                    accessibilityLabel={`Search for ${search}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.recentChipText}>{search}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => removeRecentSearch(search)}
                    accessibilityLabel={`Remove ${search} from recent searches`}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Search Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Courses Section */}
        {(activeFilter === 'All' || activeFilter === 'Courses') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {SEARCH_RESULTS.courses.map((course) => (
              <TouchableOpacity key={course.id} style={styles.courseCard}>
                <Image source={{ uri: course.image }} style={styles.courseImage} />
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>
                    {highlightMatch(course.name, course.match)}
                  </Text>
                  <Text style={styles.courseGrade}>{course.grade}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: `${course.badgeColor}20` }]}>
                      <Text style={[styles.badgeText, { color: course.badgeColor }]}>
                        {course.badge}
                      </Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* People Section */}
        {(activeFilter === 'All' || activeFilter === 'People') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {SEARCH_RESULTS.people.map((person) => (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.personAvatarContainer}>
                  {person.avatar ? (
                    <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
                  ) : (
                    <View style={[styles.personAvatar, styles.initialsAvatar]}>
                      <Text style={styles.initialsText}>{person.initials}</Text>
                    </View>
                  )}
                  <View style={[styles.roleBadge, { backgroundColor: `${person.roleColor}20` }]}>
                    <Text style={[styles.roleBadgeText, { color: person.roleColor }]}>
                      {person.role}
                    </Text>
                  </View>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>
                    {highlightMatch(person.name, person.match)}
                  </Text>
                  <Text style={styles.personDepartment}>{person.department}</Text>
                </View>
                <TouchableOpacity style={styles.chatButton}>
                  <MessageCircle size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Files Section */}
        {(activeFilter === 'All' || activeFilter === 'Files') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Files</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filesGrid}>
              {SEARCH_RESULTS.files.map((file) => (
                <TouchableOpacity key={file.id} style={styles.fileCard}>
                  <View style={[styles.fileIcon, { backgroundColor: `${file.iconColor}15` }]}>
                    <FileText size={24} color={file.iconColor} />
                  </View>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {highlightMatch(file.name, file.match)}
                  </Text>
                  <Text style={styles.fileMeta}>
                    {file.size} • {file.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
    backgroundColor: '#F8F7F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  micButton: {
    padding: 4,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  filterContainer: {
    paddingBottom: 12,
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
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  recentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  recentChipText: {
    fontSize: 14,
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  highlight: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  courseGrade: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeContainer: {
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  personAvatarContainer: {
    position: 'relative',
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
  },
  initialsAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  personDepartment: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chatButton: {
    padding: 8,
  },
  filesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});
