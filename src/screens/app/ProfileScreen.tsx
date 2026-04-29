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
import { colors, spacing } from '../../theme';
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

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatar}>{profile?.avatarEmoji ?? '🦊'}</Text>
          </View>

          <Text style={styles.name}>{profile?.displayName ?? 'Explorer'}</Text>
          <Text style={styles.email}>{profile?.email ?? 'No email found'}</Text>

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
            disabled={avatarLoading || logoutLoading || passwordLoading}
            style={({ pressed }) => [
              styles.achievementsButton,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.achievementsButtonEmoji}>🏆</Text>

            <View style={styles.achievementsButtonTextBlock}>
              <Text style={styles.achievementsButtonTitle}>
                View Achievements
              </Text>
              <Text style={styles.achievementsButtonSubtitle}>
                Track your memory milestones
              </Text>
            </View>

            <Text style={styles.achievementsButtonArrow}>→</Text>
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
            disabled={avatarLoading || logoutLoading || passwordLoading}
            style={styles.settingRow}
          >
            <Text style={styles.settingLabel}>Change avatar</Text>
            <Text style={styles.settingValue}>{profile?.avatarEmoji ?? '🦊'}</Text>
          </Pressable>

          <Pressable
            onPress={handleChangePassword}
            disabled={avatarLoading || logoutLoading || passwordLoading}
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
            disabled={avatarLoading || logoutLoading || passwordLoading}
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
                    const isSelected = avatarEmoji === profile?.avatarEmoji;

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.text}12`,
    marginBottom: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },

  avatar: {
    fontSize: 52,
  },

  name: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
    fontFamily: 'FredokaOne_400Regular',
    textAlign: 'center',
  },

  email: {
    fontSize: 14,
    color: `${colors.text}B3`,
    marginBottom: spacing.md,
  },

  levelBadge: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  streakPill: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  streakText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.text}12`,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.sm,
    fontFamily: 'FredokaOne_400Regular',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: `${colors.text}B3`,
    marginBottom: spacing.md,
  },

  progressTrack: {
    height: 18,
    borderRadius: 999,
    backgroundColor: `${colors.text}14`,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },

  achievementsButton: {
    minHeight: 76,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },

  achievementsButtonEmoji: {
    fontSize: 34,
  },

  achievementsButtonTextBlock: {
    flex: 1,
  },

  achievementsButtonTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  achievementsButtonSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.68,
  },

  achievementsButtonArrow: {
    fontSize: 24,
    fontWeight: '900',
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
    borderRadius: 24,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.xs,
    fontFamily: 'FredokaOne_400Regular',
  },

  statLabel: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.85,
    textAlign: 'center',
  },

  settingRow: {
    minHeight: 60,
    borderRadius: 20,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoutRow: {
    marginBottom: 0,
  },

  settingLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  settingValue: {
    fontSize: 22,
  },

  settingAction: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accent,
  },

  logoutLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.emphasis,
  },

  logoutValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.emphasis,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.text}12`,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.lg,
    fontFamily: 'FredokaOne_400Regular',
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
    borderRadius: 20,
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
    fontSize: 28,
  },

  closeModalButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },

  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});