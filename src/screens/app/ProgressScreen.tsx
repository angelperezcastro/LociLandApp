// src/screens/app/ProgressScreen.tsx

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AnimatedNumber } from '../../components/gamification/AnimatedNumber';
import {
  getProgressStats,
  type ProgressStats,
  type RecentAchievementSummary,
  type WeeklyActivityDay,
} from '../../services/progressService';
import { useUserStore } from '../../store/useUserStore';
import { colors, spacing } from '../../theme';

const formatAchievementDate = (date: Date | null): string => {
  if (!date) {
    return 'Recently';
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
};

export function ProgressScreen() {
  const profile = useUserStore((state) => state.profile);

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!profile?.uid) {
      setStats(null);
      setErrorMessage('You need to be logged in to view progress.');
      return;
    }

    try {
      setErrorMessage(null);

      const nextStats = await getProgressStats(profile.uid);

      setStats(nextStats);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Progress data could not be loaded.';

      setErrorMessage(message);
    }
  }, [profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        try {
          await loadStats();
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      run();

      return () => {
        isActive = false;
      };
    }, [loadStats]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await loadStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.centerStateText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Progress</Text>
          <Text style={styles.screenSubtitle}>
            Watch your memory powers grow.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load progress</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>

            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {stats ? (
          <>
            <TotalXpCard stats={stats} />
            <LevelCard stats={stats} />
            <WeeklyActivityCard days={stats.weeklyActivity} />
            <StatsGrid stats={stats} />
            <RecentAchievementsCard
              achievements={stats.recentAchievements}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const TotalXpCard = ({ stats }: { stats: ProgressStats }) => {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTextBlock}>
        <Text style={styles.heroEyebrow}>Total XP</Text>

        <AnimatedNumber
          value={stats.totalXP}
          suffix=" XP"
          style={styles.totalXpNumber}
        />

        <Text style={styles.heroSubtitle}>
          Every palace, station, review, streak, and achievement counts.
        </Text>
      </View>

      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeEmoji}>⚡</Text>
      </View>
    </View>
  );
};

const LevelCard = ({ stats }: { stats: ProgressStats }) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.levelTopRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>Level {stats.currentLevel}</Text>
        </View>

        <Text style={styles.levelTitle}>{stats.levelTitle}</Text>
      </View>

      <Text style={styles.levelSubtitle}>
        {stats.xpForNextLevel === null
          ? 'Maximum level reached.'
          : `${stats.xpRemainingForNextLevel} XP to the next level.`}
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${stats.progressPercent}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.progressPercentText}>
        {stats.progressPercent}% complete
      </Text>
    </View>
  );
};

const WeeklyActivityCard = ({ days }: { days: WeeklyActivityDay[] }) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Weekly activity</Text>
      <Text style={styles.sectionSubtitle}>
        A filled circle means you completed a review that day.
      </Text>

      <View style={styles.weekRow}>
        {days.map((day) => (
          <View key={day.dateString} style={styles.weekDay}>
            <View
              style={[
                styles.dayCircle,
                day.reviewed ? styles.dayCircleFilled : styles.dayCircleEmpty,
                day.isToday ? styles.todayCircle : null,
              ]}
            >
              <Text
                style={[
                  styles.dayCircleText,
                  day.reviewed ? styles.dayCircleTextFilled : null,
                ]}
              >
                {day.reviewed ? '✓' : ''}
              </Text>
            </View>

            <Text
              style={[
                styles.dayLabel,
                day.isToday ? styles.todayDayLabel : null,
              ]}
            >
              {day.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const StatsGrid = ({ stats }: { stats: ProgressStats }) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Stats</Text>

      <View style={styles.statsGrid}>
        <StatTile
          emoji="🏛️"
          value={stats.totalPalaces}
          label="Palaces created"
        />

        <StatTile
          emoji="🚩"
          value={stats.totalStations}
          label="Stations added"
        />

        <StatTile
          emoji="🧠"
          value={stats.totalReviewsCompleted}
          label="Reviews completed"
        />

        <StatTile
          emoji="🔥"
          value={stats.bestStreak}
          label="Best streak"
        />
      </View>
    </View>
  );
};

const StatTile = ({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) => {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statEmoji}>{emoji}</Text>

      <AnimatedNumber value={value} style={styles.statValue} />

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const RecentAchievementsCard = ({
  achievements,
}: {
  achievements: RecentAchievementSummary[];
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Recent achievements</Text>

      {achievements.length === 0 ? (
        <View style={styles.emptyAchievementBox}>
          <Text style={styles.emptyAchievementEmoji}>🏆</Text>
          <Text style={styles.emptyAchievementTitle}>No achievements yet</Text>
          <Text style={styles.emptyAchievementText}>
            Create palaces, add stations, and complete reviews to unlock your
            first badge.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementCarousel}
        >
          {achievements.map((achievement) => (
            <View
              key={achievement.achievementId}
              style={styles.recentAchievementCard}
            >
              <Text style={styles.recentAchievementEmoji}>
                {achievement.emoji}
              </Text>

              <Text numberOfLines={2} style={styles.recentAchievementTitle}>
                {achievement.title}
              </Text>

              <Text style={styles.recentAchievementDate}>
                {formatAchievementDate(achievement.earnedAt)}
              </Text>

              <View style={styles.recentAchievementXpPill}>
                <Text style={styles.recentAchievementXpText}>
                  +{achievement.xpReward} XP
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    padding: spacing.lg,
    paddingBottom: 120,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },

  centerStateText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  header: {
    marginBottom: spacing.lg,
  },

  screenTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    color: colors.text,
    fontFamily: 'FredokaOne_400Regular',
  },

  screenSubtitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: `${colors.text}B3`,
  },

  errorCard: {
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.emphasis,
  },

  errorTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.emphasis,
    marginBottom: spacing.xs,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },

  retryButton: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emphasis,
  },

  retryButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.surface,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  heroCard: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 34,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.accent,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },

  heroTextBlock: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: colors.surface,
    opacity: 0.86,
  },

  totalXpNumber: {
    marginTop: spacing.xs,
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '900',
    color: colors.surface,
    fontFamily: 'FredokaOne_400Regular',
  },

  heroSubtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.surface,
    opacity: 0.86,
  },

  heroBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.surface}30`,
    borderWidth: 2,
    borderColor: `${colors.surface}70`,
  },

  heroBadgeEmoji: {
    fontSize: 40,
  },

  sectionCard: {
    borderRadius: 34,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.text}10`,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    color: colors.text,
    fontFamily: 'FredokaOne_400Regular',
    marginBottom: spacing.xs,
  },

  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: `${colors.text}A8`,
    marginBottom: spacing.lg,
  },

  levelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  levelBadge: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: `${colors.text}12`,
  },

  levelBadgeText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    color: colors.text,
  },

  levelTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
    color: colors.text,
  },

  levelSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: `${colors.text}A8`,
    marginBottom: spacing.md,
  },

  progressTrack: {
    height: 18,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },

  progressPercentText: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: `${colors.text}99`,
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },

  weekDay: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.xs,
  },

  dayCircleFilled: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },

  dayCircleEmpty: {
    backgroundColor: colors.muted,
    borderColor: `${colors.text}10`,
  },

  todayCircle: {
    borderColor: colors.accent,
    borderWidth: 3,
  },

  dayCircleText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },

  dayCircleTextFilled: {
    color: colors.surface,
  },

  dayLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: `${colors.text}90`,
    textAlign: 'center',
  },

  todayDayLabel: {
    color: colors.accent,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  statTile: {
    width: '48%',
    minHeight: 142,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: `${colors.text}08`,
  },

  statEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },

  statValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: colors.accent,
    fontFamily: 'FredokaOne_400Regular',
  },

  statLabel: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    opacity: 0.78,
  },

  emptyAchievementBox: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },

  emptyAchievementEmoji: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },

  emptyAchievementTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },

  emptyAchievementText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    color: `${colors.text}A8`,
  },

  achievementCarousel: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },

  recentAchievementCard: {
    width: 150,
    minHeight: 180,
    borderRadius: 28,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  recentAchievementEmoji: {
    fontSize: 38,
    marginBottom: spacing.sm,
  },

  recentAchievementTitle: {
    minHeight: 42,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: colors.text,
  },

  recentAchievementDate: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: `${colors.text}A8`,
  },

  recentAchievementXpPill: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.primary,
  },

  recentAchievementXpText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    color: colors.text,
  },
});