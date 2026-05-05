import React, { useMemo, useState } from 'react';
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

import {
  AVATAR_EMOJI_OPTIONS,
  isValidEmail,
  normalizeEmail,
  VALIDATION_LIMITS,
} from '../../constants/validation';
import type { AuthScreenProps } from '../../navigation/types';
import { signUp, setCurrentUserDisplayName } from '../../services/auth';
import { createUserProfile } from '../../services/userProfile';
import { useUserStore } from '../../store/useUserStore';
import { colors, radius, spacing, typography } from '../../theme';
import { getFirebaseAuthErrorMessage } from '../../utils/getFirebaseAuthErrorMessage';
import type { AgeGroup, AvatarEmoji } from '../../types/user';

type FormErrors = {
  username?: string;
  email?: string;
  password?: string;
  ageGroup?: string;
  avatar?: string;
};

const AVATAR_OPTIONS = [...AVATAR_EMOJI_OPTIONS] as AvatarEmoji[];

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const setUserProfile = useUserStore((state) => state.setUserProfile);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarEmoji | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isFormComplete = useMemo(() => {
    return (
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length >= VALIDATION_LIMITS.auth.passwordMinLength &&
      selectedAgeGroup !== null &&
      selectedAvatar !== null
    );
  }, [username, email, password, selectedAgeGroup, selectedAvatar]);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const normalizedEmail = normalizeEmail(email);
    const usernameValue = username.trim();

    if (!usernameValue) {
      nextErrors.username = 'Username is required.';
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else {
      if (!isValidEmail(normalizedEmail)) {
        nextErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < VALIDATION_LIMITS.auth.passwordMinLength) {
      nextErrors.password = `Password must be at least ${VALIDATION_LIMITS.auth.passwordMinLength} characters.`;
    }

    if (!selectedAgeGroup) {
      nextErrors.ageGroup = 'Please select an age group.';
    }

    if (!selectedAvatar) {
      nextErrors.avatar = 'Please choose an avatar.';
    }

    return nextErrors;
  };

  const handleCreateAccount = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const trimmedUsername = username.trim();

    try {
      setLoading(true);

      const result = await signUp(normalizedEmail, password);
      await setCurrentUserDisplayName(trimmedUsername);

      const profile = await createUserProfile({
        uid: result.user.uid,
        displayName: trimmedUsername,
        email: normalizedEmail,
        avatarEmoji: selectedAvatar!,
        ageGroup: selectedAgeGroup!,
      });

      setUserProfile(profile);
      // No manual navigation here.
      // The auth observer in RootNavigator will switch to AppNavigator automatically.
    } catch (error) {
      Alert.alert('Oops!', getFirebaseAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgeGroup = (value: AgeGroup) => {
    setSelectedAgeGroup(value);
    setErrors((prev) => ({ ...prev, ageGroup: undefined }));
  };

  const handleSelectAvatar = (value: AvatarEmoji) => {
    setSelectedAvatar(value);
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Welcome to LociLand</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Pick your name, age group and animal friend to start your memory adventure.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              placeholder="Your display name"
              placeholderTextColor={colors.text + '88'}
              style={[styles.input, errors.username ? styles.inputError : null]}
              editable={!loading}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.text + '88'}
              style={[styles.input, errors.email ? styles.inputError : null]}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordWrapper, errors.password ? styles.inputError : null]}>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder={`At least ${VALIDATION_LIMITS.auth.passwordMinLength} characters`}
                placeholderTextColor={colors.text + '88'}
                style={styles.passwordInput}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                style={styles.showHideButton}
              >
                <Text style={styles.showHideText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Age group</Text>

            <View style={styles.ageGroupRow}>
              <Pressable
                onPress={() => handleSelectAgeGroup('6-9')}
                disabled={loading}
                style={[
                  styles.ageCard,
                  styles.ageCardYoung,
                  selectedAgeGroup === '6-9' ? styles.ageCardSelected : null,
                ]}
              >
                <Text style={styles.ageEmoji}>🌟</Text>
                <Text style={styles.ageTitle}>6–9 years</Text>
                <Text style={styles.ageDescription}>Bigger visuals and simpler choices</Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectAgeGroup('10-14')}
                disabled={loading}
                style={[
                  styles.ageCard,
                  styles.ageCardOlder,
                  selectedAgeGroup === '10-14' ? styles.ageCardSelected : null,
                ]}
              >
                <Text style={styles.ageEmoji}>🚀</Text>
                <Text style={styles.ageTitle}>10–14 years</Text>
                <Text style={styles.ageDescription}>More challenge and deeper practice</Text>
              </Pressable>
            </View>

            {errors.ageGroup ? <Text style={styles.errorText}>{errors.ageGroup}</Text> : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Choose your avatar</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarRow}
            >
              {AVATAR_OPTIONS.map((avatar) => {
                const isSelected = selectedAvatar === avatar;

                return (
                  <Pressable
                    key={avatar}
                    onPress={() => handleSelectAvatar(avatar)}
                    disabled={loading}
                    style={[
                      styles.avatarOption,
                      isSelected ? styles.avatarOptionSelected : null,
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{avatar}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {errors.avatar ? <Text style={styles.errorText}>{errors.avatar}</Text> : null}
          </View>

          <Pressable
            onPress={handleCreateAccount}
            disabled={loading}
            style={[
              styles.createButton,
              !isFormComplete || loading ? styles.createButtonDisabled : null,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextStrong}>Log in</Text>
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
    color: colors.accent,
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
    marginBottom: spacing.xl,
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
  passwordWrapper: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  showHideButton: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  showHideText: {
    fontSize: typography.small.fontSize,
    fontWeight: '800',
    color: colors.accent,
  },
  inputError: {
    borderColor: colors.emphasis,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.emphasis,
  },
  ageGroupRow: {
    gap: spacing.md,
  },
  ageCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  ageCardYoung: {
    backgroundColor: colors.primarySoft,
  },
  ageCardOlder: {
    backgroundColor: colors.accentSoft,
  },
  ageCardSelected: {
    borderColor: colors.text,
    transform: [{ scale: 1.01 }],
  },
  ageEmoji: {
    fontSize: typography.h1.fontSize,
    marginBottom: spacing.sm,
  },
  ageTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ageDescription: {
    fontSize: typography.caption.fontSize,
    lineHeight: 20,
    color: colors.text,
    opacity: 0.85,
  },
  avatarRow: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  avatarOption: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  avatarOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    transform: [{ scale: 1.05 }],
  },
  avatarEmoji: {
    fontSize: typography.h1.fontSize + spacing.xs,
  },
  createButton: {
    minHeight: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: '900',
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
  },
  loginLinkTextStrong: {
    fontWeight: '900',
    color: colors.accent,
  },
});