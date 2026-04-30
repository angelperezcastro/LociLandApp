// src/screens/app/ProfileScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  deleteCurrentUserAccount,
  resetPassword,
  signOut,
} from '../../services/auth';
import { updateUserProfile } from '../../services/userProfile';
import { useUserStore } from '../../store/useUserStore';
import {
  colors,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import type { AgeGroup, AvatarEmoji } from '../../types/user';
import {
  getAgeGroupLabel,
  getAgeGroupReviewDescription,
  normalizeAgeGroup,
} from '../../utils/ageGroup';
import {
  getLevelTitle,
  getProgressPercent,
  getXpForNextLevel,
  getXpRemainingForNextLevel,
} from '../../utils/levelUtils';

const AVATAR_OPTIONS: AvatarEmoji[] = [
  '🦊',
  '🐸',
  '🦁',
  '🐼',
  '🦋',
  '🐉',
  '🦄',
  '🐬',
];

const AGE_GROUP_OPTIONS: Array<{
  value: AgeGroup;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  {
    value: '6-9',
    title: '6–9 years',
    subtitle: 'Multiple-choice review mode',
    emoji: '🧩',
  },
  {
    value: '10-14',
    title: '10–14 years',
    subtitle: 'Free-text review mode',
    emoji: '✍️',
  },
];

const PROFILE_SIZES = {
  heroAvatar: 112,
  avatarEmoji: 52,
  avatarOptionEmoji: 28,
  achievementIconContainer: 64,
  achievementArrowContainer: 52,
  minSettingRowHeight: 60,
  minPrimaryActionHeight: 54,
} as const;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isRecentLoginRequired(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';

  return (
    code === 'auth/requires-recent-login' ||
    message.toLowerCase().includes('requires-recent-login')
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();

  const profile = useUserStore((state) => state.profile);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const clearUser = useUserStore((state) => state.clearUser);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [ageGroupLoading, setAgeGroupLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [ageModalVisible, setAgeModalVisible] = useState(false);

  const currentLevel = profile?.level ?? 1;
  const currentXp = profile?.xp ?? 0;
  const currentStreak = profile?.streak ?? 0;
  const levelTitle = profile?.levelTitle ?? getLevelTitle(currentLevel);
  const currentAgeGroup = normalizeAgeGroup(profile?.ageGroup);

  const nextLevelXp = getXpForNextLevel(currentLevel);
  const xpRemaining = getXpRemainingForNextLevel(currentXp);
  const xpProgressPercent = getProgressPercent(currentXp);

  const isBusy =
    logoutLoading ||
    passwordLoading ||
    avatarLoading ||
    ageGroupLoading ||
    deleteLoading;

  const stats = useMemo(
    () => ({
      totalPalaces: 0,
      totalStations: 0,
      totalReviews: 0,
    }),
    [],
  );

  const avatarRows = useMemo(() => chunkArray(AVATAR_OPTIONS, 4), []);

  const handleOpenAchievements = () => {
    navigation.navigate('Achievements');
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Do you want to log out now?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLogoutLoading(true);
            await signOut();
            clearUser();
          } catch {
            Alert.alert('Error', 'Could not log out. Please try again.');
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your sign-in account from LociLand. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await deleteCurrentUserAccount();
              clearUser();
            } catch (error) {
              if (isRecentLoginRequired(error)) {
                Alert.alert(
                  'Log in again first',
                  'For security, Firebase needs a recent login before deleting an account. Log out, log back in, and try again.',
                );
                return;
              }

              Alert.alert(
                'Error',
                'Could not delete the account. Please try again.',
              );
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    if (!profile?.email) {
      Alert.alert('Error', 'No email was found for this account.');
      return;
    }

    try {
      setPasswordLoading(true);
      await resetPassword(profile.email);
      Alert.alert(
        'Email sent',
        'We sent you a password reset email. Check your inbox.',
      );
    } catch {
      Alert.alert('Error', 'Could not send the password reset email.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeAvatar = async (avatarEmoji: AvatarEmoji) => {
    if (!profile?.uid) {
      return;
    }

    try {
      setAvatarLoading(true);
      await updateUserProfile(profile.uid, { avatarEmoji });
      setUserProfile({
        ...profile,
        avatarEmoji,
      });
      setAvatarModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not update your avatar. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangeAgeGroup = async (ageGroup: AgeGroup) => {
    if (!profile?.uid) {
      return;
    }

    const normalizedAgeGroup = normalizeAgeGroup(ageGroup);

    try {
      setAgeGroupLoading(true);
      await updateUserProfile(profile.uid, { ageGroup: normalizedAgeGroup });
      setUserProfile({
        ...profile,
        ageGroup: normalizedAgeGroup,
      });
      setAgeModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not update the age group. Please try again.');
    } finally {
      setAgeGroupLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatar}>{profile.avatarEmoji ?? '🦊'}</Text>
          </View>

          <Text style={styles.name}>{profile.displayName ?? 'Explorer'}</Text>
          <Text style={styles.email}>{profile.email ?? 'No email found'}</Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              ⭐ {levelTitle} · Level {currentLevel}
            </Text>
          </View>

          <View style={styles.streakPill}>
            <Text style={styles.streakText}>
              🔥 {currentStreak} days in a row
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>XP progress</Text>

          <Text style={styles.sectionSubtitle}>
            {nextLevelXp === null
              ? `${currentXp} XP · Max level reached`
              : `${currentXp} XP · ${xpRemaining} XP to next level`}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${xpProgressPercent}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          <Text style={styles.sectionSubtitle}>
            View your badges, rewards, and locked mystery achievements.
          </Text>

          <Pressable
            onPress={handleOpenAchievements}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.achievementsFloatingCard,
              pressed ? styles.achievementsFloatingCardPressed : null,
            ]}
          >
            <View style={styles.achievementsFloatingTop}>
              <View style={styles.achievementsIconContainer}>
                <Text style={styles.achievementsIcon}>🏆</Text>
              </View>
            </View>

            <View style={styles.achievementsFloatingContent}>
              <Text style={styles.achievementsFloatingTitle}>
                View Achievements
              </Text>
              <Text style={styles.achievementsFloatingSubtitle}>
                Track your memory milestones
              </Text>
            </View>

            <View style={styles.achievementsFloatingFooter}>
              <View style={styles.achievementsArrowContainer}>
                <Text style={styles.achievementsArrow}>→</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stats</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalPalaces}</Text>
              <Text style={styles.statLabel}>Palaces</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalStations}</Text>
              <Text style={styles.statLabel}>Stations</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <Pressable
            onPress={() => setAvatarModalVisible(true)}
            disabled={isBusy}
            style={styles.settingRow}
          >
            <Text style={styles.settingLabel}>Change avatar</Text>
            <Text style={styles.settingValue}>{profile.avatarEmoji ?? '🦊'}</Text>
          </Pressable>

          <Pressable
            onPress={() => setAgeModalVisible(true)}
            disabled={isBusy}
            style={styles.settingRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingLabel}>Change age group</Text>
              <Text style={styles.settingHelper}>
                {getAgeGroupReviewDescription(currentAgeGroup)}
              </Text>
            </View>
            {ageGroupLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.settingAction}>
                {getAgeGroupLabel(currentAgeGroup)}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleChangePassword}
            disabled={isBusy}
            style={styles.settingRow}
          >
            <Text style={styles.settingLabel}>Change password</Text>
            {passwordLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.settingAction}>Send email</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleLogout}
            disabled={isBusy}
            style={[styles.settingRow, styles.logoutRow]}
          >
            <Text style={styles.logoutLabel}>Log out</Text>
            {logoutLoading ? (
              <ActivityIndicator color={colors.emphasis} />
            ) : (
              <Text style={styles.logoutValue}>→</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            disabled={isBusy}
            style={[styles.settingRow, styles.deleteAccountRow]}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.deleteAccountLabel}>Delete account</Text>
              <Text style={styles.deleteAccountHelper}>
                Permanently remove this sign-in account
              </Text>
            </View>
            {deleteLoading ? (
              <ActivityIndicator color={colors.emphasis} />
            ) : (
              <Text style={styles.deleteAccountValue}>✕</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose your avatar</Text>

            <View style={styles.avatarGrid}>
              {avatarRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.avatarRow}>
                  {row.map((avatarEmoji) => {
                    const isSelected = avatarEmoji === profile.avatarEmoji;

                    return (
                      <Pressable
                        key={avatarEmoji}
                        onPress={() => handleChangeAvatar(avatarEmoji)}
                        disabled={avatarLoading}
                        style={[
                          styles.avatarOption,
                          isSelected ? styles.avatarOptionSelected : null,
                        ]}
                      >
                        <Text style={styles.avatarOptionEmoji}>
                          {avatarEmoji}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => setAvatarModalVisible(false)}
              disabled={avatarLoading}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={ageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAgeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose age group</Text>
            <Text style={styles.modalSubtitle}>
              This changes how review questions work.
            </Text>

            <View style={styles.ageOptionsWrapper}>
              {AGE_GROUP_OPTIONS.map((option) => {
                const isSelected = option.value === currentAgeGroup;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleChangeAgeGroup(option.value)}
                    disabled={ageGroupLoading}
                    style={[
                      styles.ageOptionCard,
                      isSelected ? styles.ageOptionCardSelected : null,
                    ]}
                  >
                    <View style={styles.ageOptionIconCircle}>
                      <Text style={styles.ageOptionEmoji}>{option.emoji}</Text>
                    </View>
                    <View style={styles.ageOptionTextGroup}>
                      <Text style={styles.ageOptionTitle}>{option.title}</Text>
                      <Text style={styles.ageOptionSubtitle}>
                        {option.subtitle}
                      </Text>
                    </View>
                    <Text style={styles.ageOptionCheckmark}>
                      {isSelected ? '✓' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setAgeModalVisible(false)}
              disabled={ageGroupLoading}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.bodyStrong,
    color: colors.textSoft,
    textAlign: 'center',
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.text}12`,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarCircle: {
    width: PROFILE_SIZES.heroAvatar,
    height: PROFILE_SIZES.heroAvatar,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatar: {
    fontSize: PROFILE_SIZES.avatarEmoji,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    color: `${colors.text}B3`,
    marginBottom: spacing.md,
  },
  levelBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  levelBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '900',
    textAlign: 'center',
  },
  streakPill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  streakText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.text}12`,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: `${colors.text}B3`,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: `${colors.text}14`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  achievementsFloatingCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.text}10`,
    ...shadows.elevated,
  },
  achievementsFloatingCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  achievementsFloatingTop: {
    marginBottom: spacing.md,
  },
  achievementsIconContainer: {
    width: PROFILE_SIZES.achievementIconContainer,
    height: PROFILE_SIZES.achievementIconContainer,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.text}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsIcon: {
    fontSize: fontSizes.display,
  },
  achievementsFloatingContent: {
    marginBottom: spacing.md,
  },
  achievementsFloatingTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  achievementsFloatingSubtitle: {
    ...typography.caption,
    fontWeight: '700',
    color: `${colors.text}B0`,
  },
  achievementsFloatingFooter: {
    alignItems: 'flex-start',
  },
  achievementsArrowContainer: {
    width: PROFILE_SIZES.achievementArrowContainer,
    height: PROFILE_SIZES.achievementArrowContainer,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.text}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementsArrow: {
    ...typography.h1,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  statCard: {
    flex: 1,
    minHeight: 140,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    width: '100%',
    fontWeight: '800',
    color: colors.text,
    opacity: 0.85,
    textAlign: 'center',
  },
  settingRow: {
    minHeight: PROFILE_SIZES.minSettingRowHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  logoutRow: {
    marginBottom: spacing.md,
  },
  settingTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  settingLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  settingHelper: {
    ...typography.small,
    color: colors.textSoft,
  },
  settingValue: {
    fontSize: fontSizes.xl,
  },
  settingAction: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent,
    textAlign: 'right',
  },
  logoutLabel: {
    ...typography.bodyStrong,
    color: colors.emphasis,
  },
  logoutValue: {
    ...typography.h2,
    color: colors.emphasis,
  },
  deleteAccountRow: {
    backgroundColor: colors.emphasisSoft,
    borderWidth: 1,
    borderColor: `${colors.emphasis}55`,
    marginBottom: spacing.none,
  },
  deleteAccountLabel: {
    ...typography.bodyStrong,
    color: colors.emphasis,
  },
  deleteAccountHelper: {
    ...typography.small,
    color: colors.textSoft,
  },
  deleteAccountValue: {
    ...typography.h2,
    color: colors.emphasis,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.text}12`,
    ...shadows.card,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  avatarGrid: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: `${colors.text}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  avatarOptionEmoji: {
    fontSize: PROFILE_SIZES.avatarOptionEmoji,
  },
  ageOptionsWrapper: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ageOptionCard: {
    minHeight: 88,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ageOptionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  ageOptionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ageOptionEmoji: {
    fontSize: fontSizes.xl,
  },
  ageOptionTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  ageOptionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  ageOptionSubtitle: {
    ...typography.caption,
    color: colors.textSoft,
  },
  ageOptionCheckmark: {
    ...typography.h2,
    color: colors.accent,
    minWidth: 24,
    textAlign: 'center',
  },
  closeModalButton: {
    minHeight: PROFILE_SIZES.minPrimaryActionHeight,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  closeModalButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
