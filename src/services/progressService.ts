// src/services/progressService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import {
  ACHIEVEMENT_BY_ID,
  type AchievementId,
} from '../assets/achievements';
import {
  getLevelFromXP,
  getLevelTitle,
  getProgressPercent,
  getXpForNextLevel,
  getXpRemainingForNextLevel,
} from '../utils/levelUtils';
import { db } from './firebase';
import {
  getUserStatsSummary,
  rebuildUserStatsSummary,
  type UserStatsSummary,
} from './statsService';

const USERS_COLLECTION = 'users';
const ACHIEVEMENTS_COLLECTION = 'achievements';

export interface WeeklyActivityDay {
  dateString: string;
  label: string;
  reviewed: boolean;
  isToday: boolean;
}

export interface RecentAchievementSummary {
  achievementId: AchievementId;
  title: string;
  emoji: string;
  xpReward: number;
  earnedAt: Date | null;
}

export interface ProgressStats {
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
  progressPercent: number;
  xpRemainingForNextLevel: number;
  xpForNextLevel: number | null;

  currentStreak: number;
  bestStreak: number;

  totalPalaces: number;
  totalStations: number;
  totalReviewsCompleted: number;

  weeklyActivity: WeeklyActivityDay[];
  recentAchievements: RecentAchievementSummary[];
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const getUserRef = (userId: string) => {
  return doc(db, USERS_COLLECTION, userId);
};

const getAchievementsCollectionRef = (userId: string) => {
  return collection(db, USERS_COLLECTION, userId, ACHIEVEMENTS_COLLECTION);
};

const getSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const isTimestamp = (value: unknown): value is Timestamp => {
  return value instanceof Timestamp;
};

const pad2 = (value: number): string => {
  return String(value).padStart(2, '0');
};

const getLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
};

const timestampToDate = (value: unknown): Date | null => {
  if (!isTimestamp(value)) {
    return null;
  }

  return value.toDate();
};

const getStartOfCurrentWeekMonday = (): Date => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const jsDay = today.getDay();
  const daysFromMonday = jsDay === 0 ? 6 : jsDay - 1;

  const monday = new Date(today);

  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
};

const getCurrentWeekMondayToSunday = (): WeeklyActivityDay[] => {
  const monday = getStartOfCurrentWeekMonday();
  const todayString = getLocalDateString(new Date());

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);
    date.setHours(0, 0, 0, 0);

    const dateString = getLocalDateString(date);

    return {
      dateString,
      label,
      reviewed: false,
      isToday: dateString === todayString,
    };
  });
};

const getRecentAchievements = async (
  userId: string,
): Promise<RecentAchievementSummary[]> => {
  const snapshot = await getDocs(getAchievementsCollectionRef(userId));

  return snapshot.docs
    .filter((achievementDoc) => achievementDoc.id in ACHIEVEMENT_BY_ID)
    .map((achievementDoc) => {
      const achievementId = achievementDoc.id as AchievementId;
      const achievementDefinition = ACHIEVEMENT_BY_ID[achievementId];
      const data = achievementDoc.data();

      return {
        achievementId,
        title:
          typeof data.title === 'string'
            ? data.title
            : achievementDefinition.title,
        emoji:
          typeof data.emoji === 'string'
            ? data.emoji
            : achievementDefinition.emoji,
        xpReward: getSafeNumber(
          data.xpReward,
          achievementDefinition.xpReward,
        ),
        earnedAt: timestampToDate(data.earnedAt),
      };
    })
    .sort((first, second) => {
      const firstTime = first.earnedAt?.getTime() ?? 0;
      const secondTime = second.earnedAt?.getTime() ?? 0;

      return secondTime - firstTime;
    })
    .slice(0, 3);
};


const statsSummaryLooksObviouslyStale = (
  statsSummary: UserStatsSummary,
  totalXP: number,
): boolean => {
  return (
    totalXP > 0 &&
    statsSummary.totalPalaces === 0 &&
    statsSummary.totalStations === 0 &&
    statsSummary.totalReviewSessions === 0
  );
};

export const getProgressStats = async (
  userId: string,
): Promise<ProgressStats> => {
  if (!userId.trim()) {
    throw new Error('getProgressStats failed: userId is required.');
  }

  const [userSnapshot, initialStatsSummary, recentAchievements] = await Promise.all([
    getDoc(getUserRef(userId)),
    getUserStatsSummary(userId),
    getRecentAchievements(userId),
  ]);

  if (!userSnapshot.exists()) {
    throw new Error(`User profile "${userId}" does not exist.`);
  }

  const userData = userSnapshot.data();

  const totalXP = getSafeNumber(userData.xp);
  const currentLevel = getLevelFromXP(totalXP);
  const levelTitle = getLevelTitle(currentLevel);

  const currentStreak = getSafeNumber(userData.streak);
  const bestStreak = getSafeNumber(userData.bestStreak, currentStreak);

  const statsSummary = statsSummaryLooksObviouslyStale(
    initialStatsSummary,
    totalXP,
  )
    ? await rebuildUserStatsSummary(userId)
    : initialStatsSummary;

  const reviewedDateStrings = new Set(statsSummary.reviewDateStrings);

  const weeklyActivity = getCurrentWeekMondayToSunday().map((day) => ({
    ...day,
    reviewed: reviewedDateStrings.has(day.dateString),
  }));

  return {
    totalXP,
    currentLevel,
    levelTitle,
    progressPercent: getProgressPercent(totalXP),
    xpRemainingForNextLevel: getXpRemainingForNextLevel(totalXP),
    xpForNextLevel: getXpForNextLevel(currentLevel),

    currentStreak,
    bestStreak,

    totalPalaces: statsSummary.totalPalaces,
    totalStations: statsSummary.totalStations,
    totalReviewsCompleted: statsSummary.totalReviewSessions,

    weeklyActivity,
    recentAchievements,
  };
};
