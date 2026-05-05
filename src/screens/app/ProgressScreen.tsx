// src/screens/app/ProgressScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AnimatedNumber } from '../../components/gamification/AnimatedNumber';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback';
import { useAgeGroup, type AgeGroupUi } from '../../hooks/useAgeGroup';
import {
  getProgressStats,
  type ProgressStats,
  type RecentAchievementSummary,
  type WeeklyActivityDay,
} from '../../services/progressService';
import { useUserStore } from '../../store/useUserStore';
import {
  colors,
  fontFamilies,
  fontSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';
import { getUserFriendlyError } from '../../utils/errorMessages';

const formatAchievementDate = (date: Date | null): string => {
  if (!date) {
    return 'Recently';
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
};

const getStarsFromProgress = (value: number, maxReference: number): string => {
  if (value <= 0) {
    return '☆☆☆☆☆';
  }

  const filledStars = Math.min(5, Math.max(1, Math.ceil((value / maxReference) * 5)));
  const emptyStars = 5 - filledStars;

  return `${'★'.repeat(filledStars)}${'☆'.repeat(emptyStars)}`;
};

export function ProgressScreen() {
  const profile = useUserStore((state) => state.profile);
  const ageGroupUi = useAgeGroup();

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
      setErrorMessage(
        getUserFriendlyError(error, 'Progress data could not be loaded.'),
      );
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

  const dynamicTextStyles = useMemo(
    () => ({
      screenTitle: {
        fontSize: ageGroupUi.scaleFont(fontSizes.display),
        lineHeight: ageGroupUi.scaleLineHeight(lineHeights.display),
      },
      screenSubtitle: {
        fontSize: ageGroupUi.scaleFont(fontSizes.md),
        lineHeight: ageGroupUi.scaleLineHeight(lineHeights.md),
      },
    }),
    [ageGroupUi],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <LoadingState
          title="Loading your progress..."
          message="Preparing your memory stats."
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && !stats) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.stateShell}>
          <ErrorState
            fullScreen
            title="Could not load progress"
            message={errorMessage}
            onAction={handleRefresh}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.stateShell}>
          <EmptyState
            icon="📊"
            title="No progress yet"
            message="Complete a review session to start filling this screen."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          ageGroupUi.isYounger ? styles.youngerContent : null,
        ]}
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
          <Text
            style={[
              styles.screenTitle,
              ageGroupUi.isYounger ? dynamicTextStyles.screenTitle : null,
            ]}
          >
            {ageGroupUi.isYounger ? 'Progress ⭐' : 'Progress'}
          </Text>

          <Text
            style={[
              styles.screenSubtitle,
              ageGroupUi.isYounger ? dynamicTextStyles.screenSubtitle : null,
            ]}
          >
            {ageGroupUi.isYounger
              ? 'Your memory stars are growing.'
              : 'Watch your memory powers grow.'}
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.inlineErrorCard}>
            <Text style={styles.inlineErrorTitle}>Could not refresh progress</Text>
            <Text style={styles.inlineErrorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {ageGroupUi.isYounger ? (
          <YoungerProgressDashboard stats={stats} ageGroupUi={ageGroupUi} />
        ) : (
          <>
            <TotalXpCard stats={stats} />
            <LevelCard stats={stats} />
            <WeeklyActivityCard days={stats.weeklyActivity} />
            <StatsGrid stats={stats} />
            <RecentAchievementsCard
              achievements={stats.recentAchievements}
              showXpReward
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const YoungerProgressDashboard = ({
  stats,
  ageGroupUi,
}: {
  stats: ProgressStats;
  ageGroupUi: AgeGroupUi;
}) => {
  const totalMemoryActions =
    stats.totalPalaces + stats.totalStations + stats.totalReviewsCompleted;

  return (
    <>
      <View style={styles.youngerHeroCard}>
        <Text
          style={[
            styles.youngerHeroEmoji,
            { fontSize: ageGroupUi.scaleFont(fontSizes.display + spacing.md) },
          ]}
        >
          🌟
        </Text>

        <Text
          style={[
            styles.youngerHeroTitle,
            {
              fontSize: ageGroupUi.scaleFont(fontSizes.xxl),
              lineHeight: ageGroupUi.scaleLineHeight(lineHeights.xxl),
            },
          ]}
        >
          Memory Stars
        </Text>

        <Text style={styles.youngerStars}>
          {getStarsFromProgress(totalMemoryActions, 20)}
        </Text>

        <Text
          style={[
            styles.youngerHeroSubtitle,
            {
              fontSize: ageGroupUi.scaleFont(fontSizes.md),
              lineHeight: ageGroupUi.scaleLineHeight(lineHeights.md),
            },
          ]}
        >
          Keep visiting your palaces to fill more stars.
        </Text>
      </View>

      <YoungerWeeklyActivityCard days={stats.weeklyActivity} ageGroupUi={ageGroupUi} />

      <View style={styles.sectionCard}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontSize: ageGroupUi.scaleFont(fontSizes.xl),
              lineHeight: ageGroupUi.scaleLineHeight(lineHeights.xl),
            },
          ]}
        >
          Your adventure 🏰
        </Text>

        <View style={styles.youngerStatsGrid}>
          <YoungerStatTile
            emoji="🏛️"
            stars={getStarsFromProgress(stats.totalPalaces, 5)}
            label="Palaces"
            ageGroupUi={ageGroupUi}
          />
          <YoungerStatTile
            emoji="🚩"
            stars={getStarsFromProgress(stats.totalStations, 20)}
            label="Stations"
            ageGroupUi={ageGroupUi}
          />
          <YoungerStatTile
            emoji="🧠"
            stars={getStarsFromProgress(stats.totalReviewsCompleted, 10)}
            label="Reviews"
            ageGroupUi={ageGroupUi}
          />
          <YoungerStatTile
            emoji="🔥"
            stars={getStarsFromProgress(stats.bestStreak, 7)}
            label="Streak"
            ageGroupUi={ageGroupUi}
          />
        </View>
      </View>

      <RecentAchievementsCard
        achievements={stats.recentAchievements}
        showXpReward={false}
      />
    </>
  );
};

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

const YoungerWeeklyActivityCard = ({
  days,
  ageGroupUi,
}: {
  days: WeeklyActivityDay[];
  ageGroupUi: AgeGroupUi;
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text
        style={[
          styles.sectionTitle,
          {
            fontSize: ageGroupUi.scaleFont(fontSizes.xl),
            lineHeight: ageGroupUi.scaleLineHeight(lineHeights.xl),
          },
        ]}
      >
        This week ⭐
      </Text>

      <Text
        style={[
          styles.sectionSubtitle,
          {
            fontSize: ageGroupUi.scaleFont(fontSizes.sm),
            lineHeight: ageGroupUi.scaleLineHeight(lineHeights.sm),
          },
        ]}
      >
        Stars show the days you practised.
      </Text>

      <View style={styles.weekRow}>
        {days.map((day) => (
          <View key={day.dateString} style={styles.weekDay}>
            <View
              style={[
                styles.youngerDayCircle,
                day.reviewed
                  ? styles.youngerDayCircleFilled
                  : styles.dayCircleEmpty,
                day.isToday ? styles.todayCircle : null,
              ]}
            >
              <Text style={styles.youngerDayEmoji}>
                {day.reviewed ? '⭐' : '·'}
              </Text>
            </View>

            <Text
              style={[
                styles.dayLabel,
                day.isToday ? styles.todayDayLabel : null,
                {
                  fontSize: ageGroupUi.scaleFont(fontSizes.xs),
                  lineHeight: ageGroupUi.scaleLineHeight(lineHeights.xs),
                },
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
        <StatTile emoji="🏛️" value={stats.totalPalaces} label="Palaces created" />
        <StatTile emoji="🚩" value={stats.totalStations} label="Stations added" />
        <StatTile emoji="🧠" value={stats.totalReviewsCompleted} label="Reviews completed" />
        <StatTile emoji="🔥" value={stats.bestStreak} label="Best streak" />
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

const YoungerStatTile = ({
  emoji,
  stars,
  label,
  ageGroupUi,
}: {
  emoji: string;
  stars: string;
  label: string;
  ageGroupUi: AgeGroupUi;
}) => {
  return (
    <View style={styles.youngerStatTile}>
      <Text
        style={[
          styles.statEmoji,
          { fontSize: ageGroupUi.scaleFont(fontSizes.xxl) },
        ]}
      >
        {emoji}
      </Text>
      <Text style={styles.youngerStatStars}>{stars}</Text>
      <Text
        style={[
          styles.statLabel,
          {
            fontSize: ageGroupUi.scaleFont(fontSizes.xs),
            lineHeight: ageGroupUi.scaleLineHeight(lineHeights.xs),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const RecentAchievementsCard = ({
  achievements,
  showXpReward,
}: {
  achievements: RecentAchievementSummary[];
  showXpReward: boolean;
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {showXpReward ? 'Recent achievements' : 'Badges 🏆'}
      </Text>

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

              {showXpReward ? (
                <View style={styles.recentAchievementXpPill}>
                  <Text style={styles.recentAchievementXpText}>
                    +{achievement.xpReward} XP
                  </Text>
                </View>
              ) : null}
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
  stateShell: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  youngerContent: {
    paddingHorizontal: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  screenTitle: {
    ...typography.display,
    color: colors.text,
  },
  screenSubtitle: {
    ...typography.bodyStrong,
    marginTop: spacing.xs,
    color: colors.textSoft,
  },
  inlineErrorCard: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.emphasis,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inlineErrorTitle: {
    ...typography.h3,
    color: colors.emphasis,
    marginBottom: spacing.xs,
  },
  inlineErrorText: {
    ...typography.caption,
    color: colors.text,
  },
  heroCard: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xxl,
    backgroundColor: colors.accent,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.elevated,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroEyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: colors.surface,
    fontFamily: fontFamilies.bodyBold,
  },
  totalXpNumber: {
    ...typography.display,
    marginTop: spacing.xs,
    color: colors.surface,
    fontSize: fontSizes.display + spacing.xs,
    lineHeight: 50,
  },
  heroSubtitle: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.surface,
  },
  heroBadge: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroBadgeEmoji: {
    ...typography.display,
    fontSize: fontSizes.display,
  },
  youngerHeroCard: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xxl,
    backgroundColor: colors.primary,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.elevated,
  },
  youngerHeroEmoji: {
    marginBottom: spacing.xs,
  },
  youngerHeroTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  youngerStars: {
    ...typography.h1,
    color: colors.text,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  youngerHeroSubtitle: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSoft,
    marginBottom: spacing.lg,
  },
  levelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  levelBadge: {
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  levelBadgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.bodyBold,
    color: colors.text,
  },
  levelTitle: {
    ...typography.h3,
    flex: 1,
    color: colors.text,
  },
  levelSubtitle: {
    ...typography.caption,
    color: colors.textSoft,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 18,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  progressPercentText: {
    ...typography.small,
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodyBold,
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
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  youngerDayCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: spacing.xs,
  },
  dayCircleFilled: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  youngerDayCircleFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.accent,
  },
  dayCircleEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  todayCircle: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  dayCircleText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontFamily: fontFamilies.bodyBold,
  },
  dayCircleTextFilled: {
    color: colors.surface,
  },
  youngerDayEmoji: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  dayLabel: {
    ...typography.small,
    color: colors.textSoft,
    textAlign: 'center',
    fontFamily: fontFamilies.bodyBold,
  },
  todayDayLabel: {
    color: colors.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  youngerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    width: '48%',
    minHeight: 142,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  youngerStatTile: {
    width: '48%',
    minHeight: 150,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  statEmoji: {
    ...typography.h1,
    fontSize: fontSizes.xxl,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h1,
    color: colors.accent,
  },
  youngerStatStars: {
    ...typography.bodyStrong,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    width: '100%',
    textAlign: 'center',
    color: colors.textSoft,
    fontFamily: fontFamilies.bodyBold,
    marginTop: spacing.xs,
  },
  emptyAchievementBox: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  emptyAchievementEmoji: {
    ...typography.display,
    marginBottom: spacing.sm,
  },
  emptyAchievementTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyAchievementText: {
    ...typography.small,
    textAlign: 'center',
    color: colors.textSoft,
  },
  achievementCarousel: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  recentAchievementCard: {
    width: 150,
    minHeight: 180,
    borderRadius: radius.xl,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.secondary,
    padding: spacing.md,
  },
  recentAchievementEmoji: {
    ...typography.display,
    fontSize: fontSizes.display + spacing.xxs,
    marginBottom: spacing.sm,
  },
  recentAchievementTitle: {
    ...typography.caption,
    minHeight: 42,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  recentAchievementDate: {
    ...typography.small,
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontFamily: fontFamilies.bodyBold,
  },
  recentAchievementXpPill: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recentAchievementXpText: {
    ...typography.small,
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
});