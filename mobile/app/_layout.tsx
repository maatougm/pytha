import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { SocketProvider } from '@/src/providers/SocketProvider';
import { NotificationProvider, InAppNotificationContainer } from '@/src/providers/NotificationProvider';
import { initializeI18n } from '@/src/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/src/i18n';

export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n
    initializeI18n().then(() => {
      setIsI18nReady(true);
    });
  }, []);

  if (!isI18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <InAppNotificationContainer>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(app)" />
                  </Stack>
                  <StatusBar style="auto" />
                </InAppNotificationContainer>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </I18nextProvider>
  );
}
