import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type Profile = { plan: string };

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) setProfileError(error.message);
        else setProfile(data);
      });
  }, [session]);

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="subtitle">Profile</ThemedText>
        <ThemedText>{session?.user.email}</ThemedText>
        {profile && <ThemedText themeColor="textSecondary">Plan: {profile.plan}</ThemedText>}
        {profileError && (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load profile: {profileError}
          </ThemedText>
        )}
        <PrimaryButton
          variant="plain"
          title="Sign out"
          onPress={() => supabase.auth.signOut()}
          style={styles.signOut}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
    gap: Spacing.two,
  },
  signOut: { alignSelf: 'flex-start', paddingHorizontal: 0 },
});
