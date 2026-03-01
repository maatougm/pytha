import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Users,
  User,
  Megaphone,
  BookOpen,
  MessageCircle,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRole } from '@/src/hooks/useRole';
import { api } from '@/services/api';

type ChannelType = 'direct_message' | 'group' | 'classroom' | 'teacher_parent';

interface ChannelTypeOption {
  value: ChannelType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}

export default function CreateChannelScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAdmin, isTeacher, isParent, isStudent } = useRole();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ChannelType>('direct_message');
  const [isLoading, setIsLoading] = useState(false);

  const channelTypes: ChannelTypeOption[] = [
    {
      value: 'direct_message',
      label: 'Direct Message',
      description: 'Private conversation with one person',
      icon: <User size={20} color="#fff" />,
      color: '#10b981',
    },
    {
      value: 'group',
      label: 'Group Chat',
      description: 'Chat with multiple people',
      icon: <Users size={20} color="#fff" />,
      color: '#ec4899',
    },
    {
      value: 'classroom',
      label: 'Classroom',
      description: 'Class discussion channel',
      icon: <BookOpen size={20} color="#fff" />,
      color: '#3b82f6',
      disabled: !isTeacher() && !isAdmin(),
    },
    {
      value: 'teacher_parent',
      label: 'Teacher-Parent',
      description: 'Connect teachers with parents',
      icon: <MessageCircle size={20} color="#fff" />,
      color: '#8b5cf6',
      disabled: !isTeacher() && !isParent() && !isAdmin(),
    },
  ];

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a channel name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/channels', {
        name: name.trim(),
        type: selectedType,
      });

      Alert.alert('Success', 'Channel created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace({
              pathname: '/(app)/chat/[channelId]',
              params: { channelId: response.data.id },
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create channel. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      gap: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    typeCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.border,
      opacity: 1,
    },
    typeCardDisabled: {
      opacity: 0.5,
    },
    typeCardSelected: {
      borderColor: colors.primary,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    typeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    checkmark: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    createButtonDisabled: {
      opacity: 0.7,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Channel</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Channel Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter channel name..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Channel Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Type</Text>
          <View style={styles.typeGrid}>
            {channelTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardSelected,
                  type.disabled && styles.typeCardDisabled,
                ]}
                onPress={() => !type.disabled && setSelectedType(type.value)}
                disabled={type.disabled}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                  {type.icon}
                </View>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
                {selectedType === type.value && (
                  <View style={styles.checkmark}>
                    <Check size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Channel</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
