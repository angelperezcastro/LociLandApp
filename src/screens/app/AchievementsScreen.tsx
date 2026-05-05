// src/screens/app/AchievementsScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId,
} from '../../assets/achievements';
import {
  getEarnedAchievements,
  type EarnedAchievement,
} from '../../services/achievementService';
import { selectAuthUserId, useUserStore } from '../../store/useUserStore';
import { colors, fontSizes, lineHeights, radius, spacing, typography } from '../../theme';

const GRID_COLUMNS = 3;

const isTimestamp = (value: unknown): value is Timestamp => {
  return value instanceof Timestamp;
};

const formatEarnedDate = (value: unknown): string => {
  if (isTimestamp(value)) {
    return value.toDate().toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    });
  }

  return 'Unlocked';
};

export const AchievementsScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [earnedAchievements, setEarnedAchievements] = useState<
    EarnedAchievement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userId = useUserStore(selectAuthUserId);

  const earnedAchievementMap = useMemo(() => {
    return earnedAchievements.reduce<
      Partial<Record<AchievementId, EarnedAchievement>>
    >((accumulator, achievement) => {
      accumulator[achievement.achievementId] = achievement;
      return accumulator;
    }, {});
  }, [earnedAchievements]);

  const unlockedCount = earnedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const horizontalPadding = spacing.md * 2;
  const columnGap = spacing.sm * (GRID_COLUMNS - 1);
  const cardWidth = Math.floor(
    (width - horizontalPadding - columnGap) / GRID_COLUMNS,
  );

  const loadAchievements = useCallback(async () => {
    if (!userId) {
      setEarnedAchievements([]);
      setErrorMessage('You need to be logged in to view achievements.');
      return;
    }

    try {
      setErrorMessage(null);

      const earned = await getEarnedAchievements(userId);
      setEarnedAchievements(earned);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Achievements could not be loaded.';

      setErrorMessage(message);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        await loadAchievements();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [loadAchievements]);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await loadAchievements();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderAchievement = ({
    item,
  }: {
    item: AchievementDefinition;
  }) => {
    const earnedAchievement = earnedAchievementMap[item.id];
    const isEarned = Boolean(earnedAchievement);

    return (
      <AchievementCard
        achievement={item}
        earnedAchievement={earnedAchievement}
        isEarned={isEarned}
        width={cardWidth}
      />
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.centerStateText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </Pressable>

              <View style={styles.titleBlock}>
                <Text style={styles.screenTitle}>Achievements</Text>
                <Text style={styles.screenSubtitle}>
                  Collect rewards as you train your memory.
                </Text>
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressTitle}>
                  {unlockedCount} / {totalCount} unlocked
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>

              <Text style={styles.progressHint}>
                Locked achievements stay mysterious until you earn them.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const AchievementCard = ({
  achievement,
  earnedAchievement,
  isEarned,
  width,
}: {
  achievement: AchievementDefinition;
  earnedAchievement?: EarnedAchievement;
  isEarned: boolean;
  width: number;
}) => {
  return (
    <View
      style={[
        styles.achievementCard,
        {
          width,
        },
        isEarned ? styles.achievementCardEarned : styles.achievementCardLocked,
      ]}
    >
      <View
        style={[
          styles.emojiCircle,
          isEarned ? styles.emojiCircleEarned : styles.emojiCircleLocked,
        ]}
      >
        <Text style={[styles.achievementEmoji, !isEarned && styles.lockedEmoji]}>
          {achievement.emoji}
        </Text>
      </View>

      <Text
        numberOfLines={2}
        style={[
          styles.achievementTitle,
          !isEarned && styles.lockedAchievementTitle,
        ]}
      >
        {achievement.title}
      </Text>

      {isEarned ? (
        <>
          <Text numberOfLines={2} style={styles.achievementDescription}>
            {achievement.description}
          </Text>

          <View style={styles.earnedDatePill}>
            <Text style={styles.earnedDateText}>
              {formatEarnedDate(earnedAchievement?.earnedAt)}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text numberOfLines={2} style={styles.mysteryText}>
            Mystery reward
          </Text>

          <View style={styles.lockedPill}>
            <Text style={styles.lockedPillText}>Locked</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  centerStateText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  backButtonText: {
    marginTop: -3,
    fontSize: fontSizes.display,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.text,
  },

  titleBlock: {
    flex: 1,
  },

  screenTitle: {
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: '900',
    color: colors.text,
  },

  screenSubtitle: {
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '700',
    color: colors.text,
    opacity: 0.72,
  },

  progressCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 5,
  },

  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  progressTitle: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
    fontWeight: '900',
    color: colors.text,
  },

  progressPercent: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
    fontWeight: '900',
    color: colors.accent,
  },

  progressTrack: {
    height: 16,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.text,
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },

  progressHint: {
    marginTop: spacing.sm,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.68,
  },

  errorBox: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.emphasis,
  },

  errorText: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '800',
    color: colors.bg,
  },

  gridRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  achievementCard: {
    minHeight: 190,
    alignItems: 'center',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 3,
  },

  achievementCardEarned: {
    backgroundColor: colors.bg,
    borderColor: colors.secondary,
  },

  achievementCardLocked: {
    backgroundColor: colors.bg,
    borderColor: colors.text,
    opacity: 0.48,
  },

  emojiCircle: {
    width: 62,
    height: 62,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
  },

  emojiCircleEarned: {
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
  },

  emojiCircleLocked: {
    backgroundColor: colors.bg,
    borderColor: colors.text,
  },

  achievementEmoji: {
    fontSize: fontSizes.xxl,
  },

  lockedEmoji: {
    opacity: 0.7,
  },

  achievementTitle: {
    minHeight: 42,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.text,
  },

  lockedAchievementTitle: {
    color: colors.text,
  },

  achievementDescription: {
    flex: 1,
    marginTop: spacing.sm,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    opacity: 0.78,
  },

  mysteryText: {
    flex: 1,
    marginTop: spacing.sm,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    opacity: 0.82,
  },

  earnedDatePill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },

  earnedDateText: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '900',
    color: colors.text,
  },

  lockedPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.disabled,
  },

  lockedPillText: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '900',
    color: colors.bg,
  },
});
