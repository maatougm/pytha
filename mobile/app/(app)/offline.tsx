import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wifi,
  WifiOff,
  Database,
  Cloud,
  RefreshCw,
  Trash2,
  FileText,
  MessageSquare,
  Upload,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Header } from '@/src/components/Header';
import { Card } from '@/src/components/Card';
import { useOffline } from '@/src/hooks/useOffline';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import offlineDatabase from '@/src/services/offlineDatabase';

export default function OfflineScreen() {
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const network = useNetworkStatus();
  const offline = useOffline();
  const [syncProgress, setSyncProgress] = useState<{
    total: number;
    completed: number;
  } | null>(null);

  const handleSync = async () => {
    const result = await offline.sync();
    
    if (result.success) {
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.synced} items.${result.failed > 0 ? ` ${result.failed} items failed.` : ''}`
      );
    } else {
      Alert.alert('Sync Failed', result.errors.join('\n'));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will delete all cached data, queued items, and offline messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await offlineDatabase.clearAllData();
            await offline.refresh();
            Alert.alert('Success', 'All offline data has been cleared');
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
    },
    onlineCard: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success + '30',
    },
    offlineCard: {
      backgroundColor: colors.warning + '15',
      borderColor: colors.warning + '30',
    },
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.lg,
      marginBottom: 2,
    },
    onlineText: {
      color: colors.success,
    },
    offlineText: {
      color: colors.warning,
    },
    statusSubtext: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginLeft: spacing.sm,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    statText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    statSubtext: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statValue: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.lg,
      color: colors.primary,
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    syncButtonDisabled: {
      opacity: 0.5,
    },
    syncButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.primaryForeground,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error + '15',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    clearButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.error,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    infoIcon: {
      marginRight: spacing.sm,
    },
    infoText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Offline & Sync" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View
          style={[
            styles.statusCard,
            network.isConnected ? styles.onlineCard : styles.offlineCard,
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: network.isConnected
                  ? colors.success + '30'
                  : colors.warning + '30',
              },
            ]}
          >
            {network.isConnected ? (
              <Wifi size={24} color={colors.success} />
            ) : (
              <WifiOff size={24} color={colors.warning} />
            )}
          </View>
          <View style={styles.statusTextContainer}>
            <Text
              style={[
                styles.statusTitle,
                network.isConnected ? styles.onlineText : styles.offlineText,
              ]}
            >
              {network.isConnected ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statusSubtext}>
              {network.isConnected
                ? network.isWifi
                  ? 'Connected via Wi-Fi'
                  : 'Connected via cellular'
                : 'Changes will be synced when you reconnect'}
            </Text>
          </View>
        </View>

        {/* Sync Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Sync</Text>
          
          <Card>
            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={styles.statIcon}>
                  <Cloud size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.statText}>Queued Items</Text>
                  <Text style={styles.statSubtext}>Pending changes to sync</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{offline.pendingItems}</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={styles.statIcon}>
                  <MessageSquare size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.statText}>Offline Messages</Text>
                  <Text style={styles.statSubtext}>Messages waiting to send</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{offline.pendingMessages}</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View style={styles.statIcon}>
                  <Upload size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.statText}>Pending Files</Text>
                  <Text style={styles.statSubtext}>Files waiting to upload</Text>
                </View>
              </View>
              <Text style={styles.statValue}>{offline.pendingFiles}</Text>
            </View>
          </Card>
        </View>

        {/* Storage Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          
          <Card>
            <View style={styles.infoRow}>
              <Database size={16} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                SQLite Database • Local storage
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Check size={16} color={colors.success} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Auto-sync when connection restored
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Check size={16} color={colors.success} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Last sync: {formatDate(offline.lastSyncTime)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[
            styles.syncButton,
            (!offline.isOnline || offline.isSyncing) && styles.syncButtonDisabled,
          ]}
          onPress={handleSync}
          disabled={!offline.isOnline || offline.isSyncing}
        >
          <RefreshCw
            size={20}
            color={colors.primaryForeground}
            style={offline.isSyncing ? { transform: [{ rotate: '45deg' }] } : undefined}
          />
          <Text style={styles.syncButtonText}>
            {offline.isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
          <Trash2 size={20} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear Offline Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
