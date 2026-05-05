import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { normalizeEmail } from '../../constants/validation';
import type { AuthScreenProps } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import {
  resetPassword,
  signIn,
  signInWithGoogleIdToken,
} from '../../services/auth';
import { getFirebaseAuthErrorMessage } from '../../utils/getFirebaseAuthErrorMessage';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const hasGoogleConfig = useMemo(() => {
    return Boolean(
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    );
  }, []);

  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      selectAccount: true,
    });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!googleResponse) {
        return;
      }

      if (googleResponse.type !== 'success') {
        setGoogleLoading(false);
        return;
      }

      const idToken = googleResponse.params.id_token;

      if (!idToken) {
        setGoogleLoading(false);
        Alert.alert('Google sign-in failed', 'Google did not return a valid ID token.');
        return;
      }

      try {
        await signInWithGoogleIdToken(idToken);
      } catch (error) {
        Alert.alert('Google sign-in failed', getFirebaseAuthErrorMessage(error));
      } finally {
        setGoogleLoading(false);
      }
    };

    void handleGoogleResponse();
  }, [googleResponse]);

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    try {
      setPasswordLoading(true);
      await signIn(normalizedEmail, password);
      // No manual navigation here.
      // RootNavigator will switch to AppNavigator automatically.
    } catch (error) {
      Alert.alert('Login failed', getFirebaseAuthErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      Alert.alert(
        'Email required',
        'Enter your email first, then tap "Forgot password?".'
      );
      return;
    }

    try {
      setResetLoading(true);
      await resetPassword(normalizedEmail);
      Alert.alert(
        'Email sent',
        'We sent you a password reset email. Check your inbox.'
      );
    } catch (error) {
      Alert.alert('Reset failed', getFirebaseAuthErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasGoogleConfig) {
      Alert.alert(
        'Google sign-in not configured',
        'Add the Google OAuth client IDs to your .env file first.'
      );
      return;
    }

    if (!googleRequest) {
      Alert.alert(
        'Google sign-in unavailable',
        'The Google auth request is not ready yet. Try again in a moment.'
      );
      return;
    }

    try {
      setGoogleLoading(true);
      const result = await promptGoogleAsync();

      if (result.type !== 'success') {
        setGoogleLoading(false);
      }
    } catch {
      setGoogleLoading(false);
      Alert.alert('Google sign-in failed', 'Could not open the Google sign-in flow.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Welcome back</Text>
          <Text style={styles.title}>Log in to continue</Text>
          <Text style={styles.subtitle}>
            Jump back into your palaces and keep your memory streak alive.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.text + '88'}
              style={styles.input}
              editable={!passwordLoading && !googleLoading && !resetLoading}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.text + '88'}
              style={styles.input}
              editable={!passwordLoading && !googleLoading && !resetLoading}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          <Pressable
            onPress={handleForgotPassword}
            disabled={passwordLoading || googleLoading || resetLoading}
            style={styles.forgotPasswordLink}
          >
            {resetLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={passwordLoading || googleLoading || resetLoading}
            style={[
              styles.primaryButton,
              passwordLoading ? styles.buttonDisabled : null,
            ]}
          >
            {passwordLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Log In</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleGoogleLogin}
            disabled={passwordLoading || googleLoading || resetLoading}
            style={[
              styles.googleButton,
              googleLoading ? styles.buttonDisabled : null,
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Register')}
            disabled={passwordLoading || googleLoading || resetLoading}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              Create account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  kicker: {
    fontSize: typography.caption.fontSize,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.display.fontSize - spacing.xs,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '800',
    color: colors.accent,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  googleButton: {
    minHeight: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: '900',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '900',
  },
  registerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerLinkText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '900',
    color: colors.accent,
  },
});