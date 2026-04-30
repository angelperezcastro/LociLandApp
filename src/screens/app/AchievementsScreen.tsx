// src/screens/app/AchievementsScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId,
} from '../../assets/achievements';
import {
  getEarnedAchievements,
  type EarnedAchievement,
} from '../../services/achievementService';
import { auth } from '../../services/firebase';
import { ErrorState, LoadingState } from '../../components/feedback';
import {
  colors,
  fontFamilies,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { getUserFriendlyError } from '../../utils/errorMessages';

const GRID_COLUMNS = 3;
const MIN_CARD_WIDTH = 96;

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

  const [earnedAchievements, setEarnedAchievements] = useState<
    EarnedAchievement[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const cardWidth = Math.max(
    MIN_CARD_WIDTH,
    Math.floor((width - horizontalPadding - columnGap) / GRID_COLUMNS),
  );

  const loadAchievements = useCallback(async () => {
    const currentUserId = auth.currentUser?.uid;

    if (!currentUserId) {
      setEarnedAchievements([]);
      setErrorMessage('You need to be logged in to view achievements.');
      return;
    }

    try {
      setErrorMessage(null);
      const earned = await getEarnedAchievements(currentUserId);
      setEarnedAchievements(earned);
    } catch (error) {
      setErrorMessage(
        getUserFriendlyError(error, 'Achievements could not be loaded.'),
      );
    }
  }, []);

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

  const renderAchievement = ({ item }: { item: AchievementDefinition }) => {
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
        <LoadingState
          title="Loading achievements..."
          message="Checking your unlocked memory badges."
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && earnedAchievements.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorShell}>
          <ErrorState
            fullScreen
            title="Could not load achievements"
            message={errorMessage}
            onAction={handleRefresh}
          />
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
        contentContainerStyle={styles.content}
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
        { width },
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
  errorShell: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.md,
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
    ...typography.display,
    color: colors.text,
    lineHeight: 40,
    marginTop: -3,
  },
  titleBlock: {
    flex: 1,
  },
  screenTitle: {
    ...typography.h1,
    color: colors.text,
  },
  screenSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSoft,
  },
  progressCard: {
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.primary,
    padding: spacing.md,
    ...shadows.card,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  progressPercent: {
    ...typography.bodyStrong,
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
    ...typography.small,
    marginTop: spacing.sm,
    color: colors.textSoft,
  },
  gridRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  achievementCard: {
    minHeight: 190,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
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
    borderRadius: radius.pill,
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
    ...typography.h1,
    fontSize: fontSizes.xxl,
    lineHeight: 34,
  },
  lockedEmoji: {
    opacity: 0.7,
  },
  achievementTitle: {
    ...typography.caption,
    minHeight: 42,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  lockedAchievementTitle: {
    color: colors.text,
  },
  achievementDescription: {
    ...typography.small,
    minHeight: 38,
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.textSoft,
  },
  mysteryText: {
    ...typography.small,
    minHeight: 38,
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  earnedDatePill: {
    marginTop: 'auto',
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  earnedDateText: {
    ...typography.small,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  lockedPill: {
    marginTop: 'auto',
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lockedPillText: {
    ...typography.small,
    color: colors.bg,
    fontFamily: fontFamilies.bodyBold,
  },
});

export default AchievementsScreen;
