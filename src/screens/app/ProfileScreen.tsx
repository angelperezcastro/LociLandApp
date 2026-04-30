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

import { resetPassword, signOut } from '../../services/auth';
import { updateUserProfile } from '../../services/userProfile';
import { useUserStore } from '../../store/useUserStore';
import { EmptyState } from '../../components/feedback';
import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import type { AvatarEmoji } from '../../types/user';
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

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();

  const profile = useUserStore((state) => state.profile);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const clearUser = useUserStore((state) => state.clearUser);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const currentLevel = profile?.level ?? 1;
  const currentXp = profile?.xp ?? 0;
  const currentStreak = profile?.streak ?? 0;
  const levelTitle = profile?.levelTitle ?? getLevelTitle(currentLevel);

  const nextLevelXp = getXpForNextLevel(currentLevel);
  const xpRemaining = getXpRemainingForNextLevel(currentXp);
  const xpProgressPercent = getProgressPercent(currentXp);

  const stats = useMemo(
    () => ({
      totalPalaces: 0,
      totalStations: 0,
      totalReviews: 0,
    }),
    [],
  );

  const avatarRows = useMemo(() => chunkArray(AVATAR_OPTIONS, 4), []);
  const isBusy = avatarLoading || logoutLoading || passwordLoading;

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

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.stateShell}>
          <EmptyState
            icon="👤"
            title="Profile not ready"
            message="Log in again if your profile does not appear in a moment."
          />
        </View>
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
            <Text style={styles.streakText}>🔥 {currentStreak} days in a row</Text>
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
            <View style={styles.achievementsIconContainer}>
              <Text style={styles.achievementsIcon}>🏆</Text>
            </View>

            <View style={styles.achievementsFloatingContent}>
              <Text style={styles.achievementsFloatingTitle}>
                View Achievements
              </Text>
              <Text style={styles.achievementsFloatingSubtitle}>
                Track your memory milestones
              </Text>
            </View>

            <View style={styles.achievementsArrowContainer}>
              <Text style={styles.achievementsArrow}>→</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stats</Text>

          <View style={styles.statsRow}>
            <StatCard value={stats.totalPalaces} label="Palaces" />
            <StatCard value={stats.totalStations} label="Stations" />
            <StatCard value={stats.totalReviews} label="Reviews" />
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
                        <Text style={styles.avatarOptionEmoji}>{avatarEmoji}</Text>
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
    </>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  stateShell: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatar: {
    ...typography.display,
    fontSize: fontSizes.display + fontSizes.md,
    lineHeight: 58,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    color: colors.textSoft,
    marginBottom: spacing.md,
  },
  levelBadge: {
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  levelBadgeText: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    fontFamily: fontFamilies.bodyBold,
  },
  streakPill: {
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  streakText: {
    ...typography.caption,
    color: colors.white,
    fontFamily: fontFamilies.bodyBold,
  },
  sectionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
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
    color: colors.textSoft,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  achievementsFloatingCard: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card,
  },
  achievementsFloatingCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  achievementsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  achievementsIcon: {
    ...typography.display,
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
    color: colors.textSoft,
  },
  achievementsArrowContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
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
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
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
    color: colors.textSoft,
    textAlign: 'center',
    fontFamily: fontFamilies.bodyBold,
  },
  settingRow: {
    minHeight: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutRow: {
    marginBottom: spacing.none,
  },
  settingLabel: {
    ...typography.caption,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  settingValue: {
    ...typography.h2,
  },
  settingAction: {
    ...typography.caption,
    color: colors.accent,
    fontFamily: fontFamilies.bodyBold,
  },
  logoutLabel: {
    ...typography.caption,
    color: colors.emphasis,
    fontFamily: fontFamilies.bodyBold,
  },
  logoutValue: {
    ...typography.h3,
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
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  avatarOptionEmoji: {
    ...typography.h1,
    fontSize: fontSizes.xxl,
  },
  closeModalButton: {
    minHeight: 54,
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
