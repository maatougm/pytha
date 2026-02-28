import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, FileText, Video, AlertCircle, Mail } from 'lucide-react-native';

const FAQS = [
  { 
    id: '1', 
    category: 'Getting Started', 
    question: 'How do I reset my password?', 
    answer: 'Go to Settings > Account > Change Password. Enter your current password and then your new password twice to confirm.' 
  },
  { 
    id: '2', 
    category: 'Getting Started', 
    question: 'How do I join a class?', 
    answer: 'Ask your teacher for the class code. Go to Courses > Join Class and enter the code provided by your teacher.' 
  },
  { 
    id: '3', 
    category: 'Messaging', 
    question: 'How do I send a direct message?', 
    answer: 'Go to the Directory, find the person you want to message, and tap the message icon next to their name.' 
  },
  { 
    id: '4', 
    category: 'Grades', 
    question: 'Why can\'t I see my grades?', 
    answer: 'Grades are only visible after your teacher publishes them. If you believe this is an error, contact your teacher directly.' 
  },
  { 
    id: '5', 
    category: 'Technical Issues', 
    question: 'The app is crashing, what should I do?', 
    answer: 'Try force-closing the app and reopening it. If the problem persists, clear the app cache or reinstall the application.' 
  },
];

const CATEGORIES = ['All', 'Getting Started', 'Account', 'Messaging', 'Grades', 'Technical Issues'];

export default function HelpSupportScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search help articles..." 
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer} contentContainerStyle={styles.categoryContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#EFF6FF' }]}><FileText size={20} color="#1E3A8A" /></View>
            <Text style={styles.quickLinkText}>Documentation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#F0FDF4' }]}><Video size={20} color="#10B981" /></View>
            <Text style={styles.quickLinkText}>Video Tutorials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#FEF3C7' }]}><AlertCircle size={20} color="#F59E0B" /></View>
            <Text style={styles.quickLinkText}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {filteredFaqs.map(faq => (
            <TouchableOpacity key={faq.id} style={styles.faqItem} onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                {expandedId === faq.id ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
              </View>
              {expandedId === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Our support team is available Monday-Friday, 9AM-5PM</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Mail size={18} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { backgroundColor: '#1E3A8A', paddingHorizontal: 16, paddingTop: 48 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Inter' },
  placeholder: { width: 32 },
  searchContainer: { paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#0F172A', fontFamily: 'Inter' },
  categoryContainer: { maxHeight: 50, marginBottom: 8 },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)' },
  categoryChipActive: { backgroundColor: '#FFFFFF' },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: '#CBD5E1', fontFamily: 'Inter' },
  categoryChipTextActive: { color: '#1E3A8A' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12, marginTop: 8, fontFamily: 'Inter' },
  quickLinks: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickLink: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  quickLinkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLinkText: { fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center', fontFamily: 'Inter' },
  faqList: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', padding: 16 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A', paddingRight: 8, fontFamily: 'Inter' },
  faqAnswer: { fontSize: 14, color: '#64748B', marginTop: 10, lineHeight: 20, fontFamily: 'Inter' },
  contactCard: { backgroundColor: '#1E3A8A', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 30 },
  contactTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, fontFamily: 'Inter' },
  contactSubtitle: { fontSize: 13, color: '#93C5FD', textAlign: 'center', marginBottom: 16, fontFamily: 'Inter' },
  contactButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  contactButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', fontFamily: 'Inter' },
});
