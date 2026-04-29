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

const USERS_COLLECTION = 'users';
const PALACES_COLLECTION = 'palaces';
const STATIONS_COLLECTION = 'stations';
const REVIEW_SESSIONS_COLLECTION = 'reviewSessions';
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

const getUserRef = (userId: string) => {
  return doc(db, USERS_COLLECTION, userId);
};

const getPalacesCollectionRef = (userId: string) => {
  return collection(db, USERS_COLLECTION, userId, PALACES_COLLECTION);
};

const getStationsCollectionRef = (userId: string, palaceId: string) => {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    PALACES_COLLECTION,
    palaceId,
    STATIONS_COLLECTION,
  );
};

const getReviewSessionsCollectionRef = (userId: string, palaceId: string) => {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    PALACES_COLLECTION,
    palaceId,
    REVIEW_SESSIONS_COLLECTION,
  );
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

const getDayLabel = (date: Date): string => {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return labels[date.getDay()];
};

const getLastSevenDays = (): WeeklyActivityDay[] => {
  const today = new Date();
  const todayString = getLocalDateString(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);

    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    const dateString = getLocalDateString(date);

    return {
      dateString,
      label: getDayLabel(date),
      reviewed: false,
      isToday: dateString === todayString,
    };
  });
};

const timestampToDate = (value: unknown): Date | null => {
  if (!isTimestamp(value)) {
    return null;
  }

  return value.toDate();
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

export const getProgressStats = async (
  userId: string,
): Promise<ProgressStats> => {
  if (!userId.trim()) {
    throw new Error('getProgressStats failed: userId is required.');
  }

  const userSnapshot = await getDoc(getUserRef(userId));

  if (!userSnapshot.exists()) {
    throw new Error(`User profile "${userId}" does not exist.`);
  }

  const userData = userSnapshot.data();

  const totalXP = getSafeNumber(userData.xp);
  const derivedLevel = getLevelFromXP(totalXP);
  const currentLevel = getSafeNumber(userData.level, derivedLevel);
  const levelTitle =
    typeof userData.levelTitle === 'string'
      ? userData.levelTitle
      : getLevelTitle(currentLevel);

  const currentStreak = getSafeNumber(userData.streak);
  const bestStreak = getSafeNumber(userData.bestStreak, currentStreak);

  const palacesSnapshot = await getDocs(getPalacesCollectionRef(userId));
  const palaceDocs = palacesSnapshot.docs;

  let totalStations = 0;
  let totalReviewsCompleted = 0;
  const reviewedDateStrings = new Set<string>();

  await Promise.all(
    palaceDocs.map(async (palaceDoc) => {
      const palaceId = palaceDoc.id;

      const [stationsSnapshot, reviewSessionsSnapshot] = await Promise.all([
        getDocs(getStationsCollectionRef(userId, palaceId)),
        getDocs(getReviewSessionsCollectionRef(userId, palaceId)),
      ]);

      totalStations += stationsSnapshot.size;

      reviewSessionsSnapshot.docs.forEach((reviewDoc) => {
        const reviewData = reviewDoc.data();

        if (reviewData.status !== 'completed') {
          return;
        }

        totalReviewsCompleted += 1;

        const completedAt = timestampToDate(reviewData.completedAt);

        if (completedAt) {
          reviewedDateStrings.add(getLocalDateString(completedAt));
        }
      });
    }),
  );

  const weeklyActivity = getLastSevenDays().map((day) => ({
    ...day,
    reviewed: reviewedDateStrings.has(day.dateString),
  }));

  const recentAchievements = await getRecentAchievements(userId);

  return {
    totalXP,
    currentLevel,
    levelTitle,
    progressPercent: getProgressPercent(totalXP),
    xpRemainingForNextLevel: getXpRemainingForNextLevel(totalXP),
    xpForNextLevel: getXpForNextLevel(currentLevel),

    currentStreak,
    bestStreak,

    totalPalaces: palaceDocs.length,
    totalStations,
    totalReviewsCompleted,

    weeklyActivity,
    recentAchievements,
  };
};