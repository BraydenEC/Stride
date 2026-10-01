import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (!isSupabaseConfigured) return <MissingConfig />;
  if (isLoading) return null; // native splash stays up until the session is known

  const isSignedIn = Boolean(session);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

function MissingConfig() {
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.missing}>
        <ThemedText type="subtitle">Setup needed</ThemedText>
        <ThemedText>
          Supabase isn&apos;t configured. Copy <ThemedText type="code">.env.example</ThemedText> to{' '}
          <ThemedText type="code">.env.local</ThemedText>, fill in your project URL and publishable
          key, then restart <ThemedText type="code">npx expo start</ThemedText>.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  missing: { flex: 1, padding: Spacing.four, gap: Spacing.three, justifyContent: 'center' },
});
