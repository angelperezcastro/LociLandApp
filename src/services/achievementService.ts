// src/services/achievementService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import {
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId,
} from '../assets/achievements';
import type { AgeGroup } from '../types/user';
import { useAchievementToastStore } from '../store/useAchievementToastStore';
import { db } from './firebase';
import { addXP, buildXPEventId, type AddXPResult } from './xpService';

const USERS_COLLECTION = 'users';
const PALACES_COLLECTION = 'palaces';
const STATIONS_COLLECTION = 'stations';
const REVIEW_SESSIONS_COLLECTION = 'reviewSessions';
const ACHIEVEMENTS_COLLECTION = 'achievements';

const MAX_ACHIEVEMENT_CHECK_PASSES = 3;

export type AchievementTriggerEvent =
  | {
      type: 'palace_created';
      palaceId: string;
      templateId: string;
    }
  | {
      type: 'station_created';
      palaceId: string;
      stationId: string;
      hasImage: boolean;
    }
  | {
      type: 'review_completed';
      palaceId: string;
      sessionId: string;
      isPerfect: boolean;
      durationSeconds: number | null;
      correctAnswers: number;
      totalStations: number;
      xpEarned: number;
    }
  | {
      type: 'streak_updated';
      currentStreak: number;
    }
  | {
      type: 'manual_check';
    };

export interface AchievementStats {
  totalPalaces: number;
  totalStations: number;
  totalReviewSessions: number;
  totalPerfectReviews: number;
  currentStreak: number;
  bestStreak: number;
  currentLevel: number;
  usedTemplateCount: number;
  stationsWithImages: number;
  ageGroup: AgeGroup;
  fastestReviewSeconds: number | null;
}

export interface EarnedAchievement {
  achievementId: AchievementId;
  title: string;
  description: string;
  emoji: string;
  xpReward: number;
  earnedAt: unknown;
  triggerType: AchievementTriggerEvent['type'];
  xpEventId: string;
}

export interface AwardAchievementResult {
  achievement: AchievementDefinition;
  awarded: boolean;
  alreadyEarned: boolean;
  xpResult: AddXPResult;
}

export interface CheckAchievementsResult {
  newlyAwarded: AwardAchievementResult[];
  stats: AchievementStats;
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

const getAchievementDocRef = (userId: string, achievementId: AchievementId) => {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    ACHIEVEMENTS_COLLECTION,
    achievementId,
  );
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

const getDurationSeconds = (
  startedAt: unknown,
  completedAt: unknown,
): number | null => {
  if (!isTimestamp(startedAt) || !isTimestamp(completedAt)) {
    return null;
  }

  const durationMs = completedAt.toMillis() - startedAt.toMillis();

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }

  return Math.floor(durationMs / 1000);
};

const cleanMetadata = (
  metadata: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean | null> => {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean | null>;
};

const emitAchievementToast = (achievement: AchievementDefinition) => {
  useAchievementToastStore.getState().showAchievementToast({
    achievementId: achievement.id,
    title: achievement.title,
    emoji: achievement.emoji,
    xpReward: achievement.xpReward,
  });
};

const getEarnedAchievementIds = async (
  userId: string,
): Promise<Set<AchievementId>> => {
  const snapshot = await getDocs(getAchievementsCollectionRef(userId));

  return new Set(
    snapshot.docs
      .map((achievementDoc) => achievementDoc.id)
      .filter((id): id is AchievementId => id in ACHIEVEMENT_BY_ID),
  );
};

export const getEarnedAchievements = async (
  userId: string,
): Promise<EarnedAchievement[]> => {
  if (!userId.trim()) {
    throw new Error('getEarnedAchievements failed: userId is required.');
  }

  const snapshot = await getDocs(getAchievementsCollectionRef(userId));

  return snapshot.docs
    .filter((achievementDoc) => achievementDoc.id in ACHIEVEMENT_BY_ID)
    .map((achievementDoc) => {
      const data = achievementDoc.data();
      const achievementId = achievementDoc.id as AchievementId;
      const definition = ACHIEVEMENT_BY_ID[achievementId];

      return {
        achievementId,
        title:
          typeof data.title === 'string' ? data.title : definition.title,
        description:
          typeof data.description === 'string'
            ? data.description
            : definition.description,
        emoji:
          typeof data.emoji === 'string' ? data.emoji : definition.emoji,
        xpReward: getSafeNumber(data.xpReward, definition.xpReward),
        earnedAt: data.earnedAt ?? null,
        triggerType:
          typeof data.triggerType === 'string'
            ? (data.triggerType as AchievementTriggerEvent['type'])
            : 'manual_check',
        xpEventId:
          typeof data.xpEventId === 'string'
            ? data.xpEventId
            : buildXPEventId('achievement', achievementId),
      };
    });
};

const collectAchievementStats = async (
  userId: string,
): Promise<AchievementStats> => {
  const userSnapshot = await getDoc(getUserRef(userId));

  if (!userSnapshot.exists()) {
    throw new Error(`User profile "${userId}" does not exist.`);
  }

  const userData = userSnapshot.data();

  const ageGroup: AgeGroup =
    userData.ageGroup === '6-9' || userData.ageGroup === '10-14'
      ? userData.ageGroup
      : '10-14';

  const currentStreak = getSafeNumber(userData.streak);
  const bestStreak = getSafeNumber(userData.bestStreak, currentStreak);
  const currentLevel = getSafeNumber(userData.level, 1);

  const palacesSnapshot = await getDocs(getPalacesCollectionRef(userId));
  const palaceDocs = palacesSnapshot.docs;

  const usedTemplateIds = new Set<string>();

  palaceDocs.forEach((palaceDoc) => {
    const templateId = palaceDoc.data().templateId;

    if (typeof templateId === 'string' && templateId.trim()) {
      usedTemplateIds.add(templateId);
    }
  });

  let totalStations = 0;
  let stationsWithImages = 0;
  let totalReviewSessions = 0;
  let totalPerfectReviews = 0;
  let fastestReviewSeconds: number | null = null;

  await Promise.all(
    palaceDocs.map(async (palaceDoc) => {
      const palaceId = palaceDoc.id;

      const [stationsSnapshot, reviewSessionsSnapshot] = await Promise.all([
        getDocs(getStationsCollectionRef(userId, palaceId)),
        getDocs(getReviewSessionsCollectionRef(userId, palaceId)),
      ]);

      stationsSnapshot.docs.forEach((stationDoc) => {
        const stationData = stationDoc.data();

        totalStations += 1;

        if (
          typeof stationData.imageUri === 'string' &&
          stationData.imageUri.trim().length > 0
        ) {
          stationsWithImages += 1;
        }
      });

      reviewSessionsSnapshot.docs.forEach((reviewDoc) => {
        const reviewData = reviewDoc.data();

        if (reviewData.status !== 'completed') {
          return;
        }

        totalReviewSessions += 1;

        const totalStationsInReview = getSafeNumber(reviewData.totalStations);
        const correctAnswers = getSafeNumber(reviewData.correctAnswers);
        const incorrectAnswers = getSafeNumber(reviewData.incorrectAnswers);

        const perfect =
          reviewData.isPerfect === true ||
          (totalStationsInReview > 0 &&
            correctAnswers === totalStationsInReview &&
            incorrectAnswers === 0);

        if (perfect) {
          totalPerfectReviews += 1;
        }

        const durationSeconds = getDurationSeconds(
          reviewData.startedAt,
          reviewData.completedAt,
        );

        if (durationSeconds !== null) {
          fastestReviewSeconds =
            fastestReviewSeconds === null
              ? durationSeconds
              : Math.min(fastestReviewSeconds, durationSeconds);
        }
      });
    }),
  );

  return {
    totalPalaces: palaceDocs.length,
    totalStations,
    totalReviewSessions,
    totalPerfectReviews,
    currentStreak,
    bestStreak,
    currentLevel,
    usedTemplateCount: usedTemplateIds.size,
    stationsWithImages,
    ageGroup,
    fastestReviewSeconds,
  };
};

const isAchievementUnlocked = (
  achievement: AchievementDefinition,
  stats: AchievementStats,
): boolean => {
  const { condition } = achievement;

  switch (condition.type) {
    case 'palaces_created':
      return stats.totalPalaces >= condition.target;

    case 'stations_added':
      return stats.totalStations >= condition.target;

    case 'reviews_completed':
      return stats.totalReviewSessions >= condition.target;

    case 'perfect_reviews':
      return stats.totalPerfectReviews >= condition.target;

    case 'streak_reached':
      return stats.currentStreak >= condition.target;

    case 'templates_used':
      return stats.usedTemplateCount >= condition.target;

    case 'stations_with_images':
      return stats.stationsWithImages >= condition.target;

    case 'level_reached':
      return stats.currentLevel >= condition.target;

    case 'review_under_seconds':
      return (
        stats.ageGroup === condition.ageGroup &&
        stats.fastestReviewSeconds !== null &&
        stats.fastestReviewSeconds <= condition.target
      );

    default:
      return false;
  }
};

export const awardAchievement = async (
  userId: string,
  achievementId: AchievementId,
  triggerEvent: AchievementTriggerEvent = { type: 'manual_check' },
): Promise<AwardAchievementResult> => {
  if (!userId.trim()) {
    throw new Error('awardAchievement failed: userId is required.');
  }

  const achievement = ACHIEVEMENT_BY_ID[achievementId];

  if (!achievement) {
    throw new Error(`Unknown achievement id: ${achievementId}`);
  }

  const achievementRef = getAchievementDocRef(userId, achievementId);
  const existingSnapshot = await getDoc(achievementRef);

  if (existingSnapshot.exists()) {
    const xpResult = await addXP(userId, achievement.xpReward, {
      reason: 'achievement',
      eventId: buildXPEventId('achievement', achievementId),
      metadata: {
        achievementId,
        title: achievement.title,
        alreadyEarned: true,
      },
    });

    return {
      achievement,
      awarded: false,
      alreadyEarned: true,
      xpResult,
    };
  }

  const xpEventId = buildXPEventId('achievement', achievementId);

  const xpResult = await addXP(userId, achievement.xpReward, {
    reason: 'achievement',
    eventId: xpEventId,
    metadata: {
      achievementId,
      title: achievement.title,
      triggerType: triggerEvent.type,
    },
  });

  await setDoc(achievementRef, {
    achievementId,
    title: achievement.title,
    description: achievement.description,
    emoji: achievement.emoji,
    xpReward: achievement.xpReward,
    triggerType: triggerEvent.type,
    xpEventId,
    metadata: cleanMetadata({
      ...('palaceId' in triggerEvent
        ? { palaceId: triggerEvent.palaceId }
        : {}),
      ...('stationId' in triggerEvent
        ? { stationId: triggerEvent.stationId }
        : {}),
      ...('sessionId' in triggerEvent
        ? { sessionId: triggerEvent.sessionId }
        : {}),
      ...('currentStreak' in triggerEvent
        ? { currentStreak: triggerEvent.currentStreak }
        : {}),
      ...('isPerfect' in triggerEvent
        ? { isPerfect: triggerEvent.isPerfect }
        : {}),
      ...('durationSeconds' in triggerEvent
        ? { durationSeconds: triggerEvent.durationSeconds }
        : {}),
    }),
    earnedAt: serverTimestamp(),
  });

  if (xpResult.xpAdded > 0) {
    emitAchievementToast(achievement);
  }

  return {
    achievement,
    awarded: xpResult.xpAdded > 0,
    alreadyEarned: false,
    xpResult,
  };
};

export const checkAchievements = async (
  userId: string,
  triggerEvent: AchievementTriggerEvent = { type: 'manual_check' },
): Promise<CheckAchievementsResult> => {
  if (!userId.trim()) {
    throw new Error('checkAchievements failed: userId is required.');
  }

  const newlyAwarded: AwardAchievementResult[] = [];
  let latestStats = await collectAchievementStats(userId);

  for (let pass = 0; pass < MAX_ACHIEVEMENT_CHECK_PASSES; pass += 1) {
    const earnedIds = await getEarnedAchievementIds(userId);

    newlyAwarded.forEach((result) => {
      earnedIds.add(result.achievement.id);
    });

    const unlockableAchievements = ACHIEVEMENTS.filter((achievement) => {
      return (
        !earnedIds.has(achievement.id) &&
        isAchievementUnlocked(achievement, latestStats)
      );
    });

    if (unlockableAchievements.length === 0) {
      break;
    }

    for (const achievement of unlockableAchievements) {
      const result = await awardAchievement(
        userId,
        achievement.id,
        triggerEvent,
      );

      if (result.awarded) {
        newlyAwarded.push(result);
      }
    }

    latestStats = await collectAchievementStats(userId);
  }

  return {
    newlyAwarded,
    stats: latestStats,
  };
};