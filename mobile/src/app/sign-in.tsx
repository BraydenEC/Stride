import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

/**
 * Passwordless sign-in with a one-time email code.
 * A code (rather than a magic link) avoids deep-link handling and works the
 * same on iOS, Android and simulators. Emails are sent by Resend through
 * Supabase's custom SMTP setting.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (error) return setError(error.message);
    setStep('code');
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    // On success, onAuthStateChange flips the session and the router guard
    // moves the user into the app.
    if (error) setError(error.message);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedText type="subtitle">Back to running, step by step.</ThemedText>

          {step === 'email' ? (
            <>
              <ThemedText themeColor="textSecondary">
                Enter your email and we&apos;ll send you a sign-in code. No password needed.
              </ThemedText>
              <TextInput
                style={inputStyle}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={sendCode}
              />
              <PrimaryButton
                title="Send code"
                onPress={sendCode}
                loading={busy}
                disabled={!email.includes('@')}
              />
            </>
          ) : (
            <>
              <ThemedText themeColor="textSecondary">
                We sent a code to {email.trim()}. Enter it below.
              </ThemedText>
              <TextInput
                style={[inputStyle, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor={theme.textSecondary}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={verifyCode}
              />
              <PrimaryButton
                title="Sign in"
                onPress={verifyCode}
                loading={busy}
                disabled={code.trim().length < 6}
              />
              <PrimaryButton
                variant="plain"
                title="Use a different email"
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
              />
            </>
          )}

          {error && <ThemedText style={{ color: theme.danger }}>{error}</ThemedText>}

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            This app is a general wellness and education tool. It is not medical advice and does
            not replace a physical therapist or doctor.
          </ThemedText>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    minHeight: 52,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
  },
  codeInput: { letterSpacing: 6, fontSize: 22 },
  disclaimer: { marginTop: Spacing.four },
});
