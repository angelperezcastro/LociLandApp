// src/services/statsService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';

import type { PalaceTemplateId } from '../types';
import { db } from './firebase';

const USERS_COLLECTION = 'users';
const PALACES_COLLECTION = 'palaces';
const STATIONS_COLLECTION = 'stations';
const REVIEW_SESSIONS_COLLECTION = 'reviewSessions';
const STATS_COLLECTION = 'stats';
const SUMMARY_DOC_ID = 'summary';

export interface UserStatsSummary {
  totalPalaces: number;
  totalStations: number;
  totalReviewSessions: number;
  totalPerfectReviews: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  stationsWithImages: number;
  usedTemplateIds: string[];
  reviewDateStrings: string[];
  fastestReviewSeconds: number | null;
  updatedAt?: Timestamp | null;
  rebuiltAt?: Timestamp | null;
}

export interface RecordStationImageChangeInput {
  previousHadImage: boolean;
  nextHasImage: boolean;
}

export interface RecordReviewCompletedInput {
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  isPerfect: boolean;
  durationSeconds: number | null;
  completedAt: Date;
}

const EMPTY_STATS_SUMMARY: UserStatsSummary = {
  totalPalaces: 0,
  totalStations: 0,
  totalReviewSessions: 0,
  totalPerfectReviews: 0,
  totalCorrectAnswers: 0,
  totalIncorrectAnswers: 0,
  stationsWithImages: 0,
  usedTemplateIds: [],
  reviewDateStrings: [],
  fastestReviewSeconds: null,
  updatedAt: null,
  rebuiltAt: null,
};

const assertValidUserId = (userId: string) => {
  if (!userId.trim()) {
    throw new Error('statsService: userId is required.');
  }
};

const getUserRef = (userId: string) => {
  return doc(db, USERS_COLLECTION, userId);
};

const getStatsSummaryRef = (userId: string) => {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    STATS_COLLECTION,
    SUMMARY_DOC_ID,
  );
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

const getSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const clampNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

const isTimestamp = (value: unknown): value is Timestamp => {
  return value instanceof Timestamp;
};

const pad2 = (value: number): string => {
  return String(value).padStart(2, '0');
};

export const getLocalDateString = (date: Date): string => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
};

const getSafeStringArray = (value: unknown, maxLength: number): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  value.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }

    const trimmedItem = item.trim();

    if (!trimmedItem || seen.has(trimmedItem) || result.length >= maxLength) {
      return;
    }

    seen.add(trimmedItem);
    result.push(trimmedItem);
  });

  return result;
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

const stationHasImage = (data: DocumentData): boolean => {
  return typeof data.imageUri === 'string' && data.imageUri.trim().length > 0;
};

const reviewIsCompleted = (data: DocumentData): boolean => {
  return data.status === 'completed' && isTimestamp(data.completedAt);
};

const reviewIsPerfect = (data: DocumentData): boolean => {
  const totalStations = getSafeNumber(data.totalStations);
  const correctAnswers = getSafeNumber(data.correctAnswers);
  const incorrectAnswers = getSafeNumber(data.incorrectAnswers);

  return (
    data.isPerfect === true ||
    (totalStations > 0 &&
      correctAnswers === totalStations &&
      incorrectAnswers === 0)
  );
};

const normalizeStatsSummary = (
  data?: DocumentData | null,
): UserStatsSummary => {
  if (!data) {
    return { ...EMPTY_STATS_SUMMARY };
  }

  return {
    totalPalaces: getSafeNumber(data.totalPalaces),
    totalStations: getSafeNumber(data.totalStations),
    totalReviewSessions: getSafeNumber(data.totalReviewSessions),
    totalPerfectReviews: getSafeNumber(data.totalPerfectReviews),
    totalCorrectAnswers: getSafeNumber(data.totalCorrectAnswers),
    totalIncorrectAnswers: getSafeNumber(data.totalIncorrectAnswers),
    stationsWithImages: getSafeNumber(data.stationsWithImages),
    usedTemplateIds: getSafeStringArray(data.usedTemplateIds, 6),
    reviewDateStrings: getSafeStringArray(data.reviewDateStrings, 5000),
    fastestReviewSeconds:
      typeof data.fastestReviewSeconds === 'number' &&
      Number.isFinite(data.fastestReviewSeconds) &&
      data.fastestReviewSeconds >= 0
        ? Math.floor(data.fastestReviewSeconds)
        : null,
    updatedAt: isTimestamp(data.updatedAt) ? data.updatedAt : null,
    rebuiltAt: isTimestamp(data.rebuiltAt) ? data.rebuiltAt : null,
  };
};

const toFirestoreStatsPayload = (summary: UserStatsSummary) => {
  return {
    totalPalaces: clampNonNegative(summary.totalPalaces),
    totalStations: clampNonNegative(summary.totalStations),
    totalReviewSessions: clampNonNegative(summary.totalReviewSessions),
    totalPerfectReviews: clampNonNegative(summary.totalPerfectReviews),
    totalCorrectAnswers: clampNonNegative(summary.totalCorrectAnswers),
    totalIncorrectAnswers: clampNonNegative(summary.totalIncorrectAnswers),
    stationsWithImages: clampNonNegative(summary.stationsWithImages),
    usedTemplateIds: getSafeStringArray(summary.usedTemplateIds, 6),
    reviewDateStrings: getSafeStringArray(summary.reviewDateStrings, 5000),
    fastestReviewSeconds:
      summary.fastestReviewSeconds === null
        ? null
        : clampNonNegative(summary.fastestReviewSeconds),
    updatedAt: serverTimestamp(),
  };
};

const upsertStatsSummary = async (
  userId: string,
  updater: (current: UserStatsSummary) => UserStatsSummary,
): Promise<UserStatsSummary> => {
  assertValidUserId(userId);

  const statsRef = getStatsSummaryRef(userId);

  return runTransaction(db, async (transaction) => {
    const statsSnapshot = await transaction.get(statsRef);
    const current = normalizeStatsSummary(
      statsSnapshot.exists() ? statsSnapshot.data() : null,
    );
    const next = normalizeStatsSummary(updater(current));

    transaction.set(statsRef, toFirestoreStatsPayload(next));

    return next;
  });
};

export const readUserStatsSummary = async (
  userId: string,
): Promise<UserStatsSummary | null> => {
  assertValidUserId(userId);

  const snapshot = await getDoc(getStatsSummaryRef(userId));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeStatsSummary(snapshot.data());
};

export const getUserStatsSummary = async (
  userId: string,
): Promise<UserStatsSummary> => {
  const existingSummary = await readUserStatsSummary(userId);

  if (existingSummary) {
    return existingSummary;
  }

  return rebuildUserStatsSummary(userId);
};

export const rebuildUserStatsSummary = async (
  userId: string,
): Promise<UserStatsSummary> => {
  assertValidUserId(userId);

  const userSnapshot = await getDoc(getUserRef(userId));

  if (!userSnapshot.exists()) {
    throw new Error(`statsService: user profile "${userId}" does not exist.`);
  }

  const summary: UserStatsSummary = { ...EMPTY_STATS_SUMMARY };
  const usedTemplateIds = new Set<string>();
  const reviewDateStrings = new Set<string>();

  const palacesSnapshot = await getDocs(getPalacesCollectionRef(userId));

  summary.totalPalaces = palacesSnapshot.size;

  await Promise.all(
    palacesSnapshot.docs.map(async (palaceDoc) => {
      const palaceId = palaceDoc.id;
      const palaceData = palaceDoc.data();
      const templateId = palaceData.templateId;

      if (typeof templateId === 'string' && templateId.trim()) {
        usedTemplateIds.add(templateId.trim());
      }

      const [stationsSnapshot, reviewSessionsSnapshot] = await Promise.all([
        getDocs(getStationsCollectionRef(userId, palaceId)),
        getDocs(getReviewSessionsCollectionRef(userId, palaceId)),
      ]);

      summary.totalStations += stationsSnapshot.size;

      stationsSnapshot.docs.forEach((stationDoc) => {
        if (stationHasImage(stationDoc.data())) {
          summary.stationsWithImages += 1;
        }
      });

      reviewSessionsSnapshot.docs.forEach((reviewDoc) => {
        const reviewData = reviewDoc.data();

        if (!reviewIsCompleted(reviewData)) {
          return;
        }

        summary.totalReviewSessions += 1;
        summary.totalCorrectAnswers += getSafeNumber(reviewData.correctAnswers);
        summary.totalIncorrectAnswers += getSafeNumber(
          reviewData.incorrectAnswers,
        );

        if (reviewIsPerfect(reviewData)) {
          summary.totalPerfectReviews += 1;
        }

        const durationSeconds = getDurationSeconds(
          reviewData.startedAt,
          reviewData.completedAt,
        );

        if (durationSeconds !== null) {
          summary.fastestReviewSeconds =
            summary.fastestReviewSeconds === null
              ? durationSeconds
              : Math.min(summary.fastestReviewSeconds, durationSeconds);
        }

        const completedAt = reviewData.completedAt;

        if (isTimestamp(completedAt)) {
          reviewDateStrings.add(getLocalDateString(completedAt.toDate()));
        }
      });
    }),
  );

  summary.usedTemplateIds = [...usedTemplateIds];
  summary.reviewDateStrings = [...reviewDateStrings];

  await setDoc(getStatsSummaryRef(userId), {
    ...toFirestoreStatsPayload(summary),
    rebuiltAt: serverTimestamp(),
  });

  return summary;
};

export const recordPalaceCreated = async (
  userId: string,
  templateId: PalaceTemplateId,
): Promise<UserStatsSummary> => {
  return upsertStatsSummary(userId, (current) => {
    const usedTemplateIds = new Set(current.usedTemplateIds);
    usedTemplateIds.add(templateId);

    return {
      ...current,
      totalPalaces: current.totalPalaces + 1,
      usedTemplateIds: [...usedTemplateIds],
    };
  });
};

export const recordStationCreated = async (
  userId: string,
  hasImage: boolean,
): Promise<UserStatsSummary> => {
  return upsertStatsSummary(userId, (current) => ({
    ...current,
    totalStations: current.totalStations + 1,
    stationsWithImages: current.stationsWithImages + (hasImage ? 1 : 0),
  }));
};

export const recordStationDeleted = async (
  userId: string,
  hadImage: boolean,
): Promise<UserStatsSummary> => {
  return upsertStatsSummary(userId, (current) => ({
    ...current,
    totalStations: current.totalStations - 1,
    stationsWithImages: current.stationsWithImages - (hadImage ? 1 : 0),
  }));
};

export const recordStationImageChanged = async (
  userId: string,
  { previousHadImage, nextHasImage }: RecordStationImageChangeInput,
): Promise<UserStatsSummary> => {
  if (previousHadImage === nextHasImage) {
    return getUserStatsSummary(userId);
  }

  return upsertStatsSummary(userId, (current) => ({
    ...current,
    stationsWithImages:
      current.stationsWithImages + (nextHasImage ? 1 : -1),
  }));
};

export const recordReviewCompleted = async (
  userId: string,
  input: RecordReviewCompletedInput,
): Promise<UserStatsSummary> => {
  const completedDateString = getLocalDateString(input.completedAt);

  return upsertStatsSummary(userId, (current) => {
    const reviewDateStrings = new Set(current.reviewDateStrings);
    reviewDateStrings.add(completedDateString);

    const nextFastestReviewSeconds =
      input.durationSeconds === null
        ? current.fastestReviewSeconds
        : current.fastestReviewSeconds === null
          ? input.durationSeconds
          : Math.min(current.fastestReviewSeconds, input.durationSeconds);

    return {
      ...current,
      totalReviewSessions: current.totalReviewSessions + 1,
      totalPerfectReviews:
        current.totalPerfectReviews + (input.isPerfect ? 1 : 0),
      totalCorrectAnswers: current.totalCorrectAnswers + input.correctAnswers,
      totalIncorrectAnswers:
        current.totalIncorrectAnswers + input.incorrectAnswers,
      reviewDateStrings: [...reviewDateStrings],
      fastestReviewSeconds: nextFastestReviewSeconds,
    };
  });
};
