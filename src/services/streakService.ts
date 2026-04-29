// src/services/streakService.ts

import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { XP_REWARDS } from '../utils/levelUtils';
import { addXP, buildXPEventId, type AddXPResult } from './xpService';
import { db } from './firebase';

const USERS_COLLECTION = 'users';
const SEVEN_DAY_STREAK_TARGET = 7;

export interface CheckAndUpdateStreakResult {
  currentStreak: number;
  previousStreak: number;
  bestStreak: number;
  streakBroken: boolean;
  isNewRecord: boolean;
  alreadyCheckedToday: boolean;
  updatedToday: boolean;
  awardedSevenDayXP: boolean;
  xpResult?: AddXPResult;
}

const getSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const pad2 = (value: number): string => {
  return String(value).padStart(2, '0');
};

const getLocalDateString = (date = new Date()): string => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
};

const isValidDateString = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const timestampToLocalDateString = (timestamp: Timestamp): string => {
  return getLocalDateString(timestamp.toDate());
};

const normaliseLastActiveDate = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' && isValidDateString(value)) {
    return value;
  }

  if (value instanceof Timestamp) {
    return timestampToLocalDateString(value);
  }

  return null;
};

const dateStringToUtcTime = (dateString: string): number => {
  const [year, month, day] = dateString.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
};

const getDayDifference = (
  olderDateString: string,
  newerDateString: string,
): number => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const olderTime = dateStringToUtcTime(olderDateString);
  const newerTime = dateStringToUtcTime(newerDateString);

  return Math.round((newerTime - olderTime) / millisecondsPerDay);
};

export const checkAndUpdateStreak = async (
  userId: string,
): Promise<CheckAndUpdateStreakResult> => {
  if (!userId.trim()) {
    throw new Error('checkAndUpdateStreak failed: userId is required.');
  }

  const today = getLocalDateString();
  const userRef = doc(db, USERS_COLLECTION, userId);

  const streakResult = await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(`User profile "${userId}" does not exist.`);
    }

    const userData = userSnapshot.data();

    const previousStreak = getSafeNumber(userData.streak);
    const previousBestStreak = getSafeNumber(
      userData.bestStreak,
      previousStreak,
    );
    const lastActiveDate = normaliseLastActiveDate(userData.lastActiveDate);

    if (lastActiveDate === today) {
      return {
        currentStreak: previousStreak,
        previousStreak,
        bestStreak: previousBestStreak,
        streakBroken: false,
        isNewRecord: false,
        alreadyCheckedToday: true,
        updatedToday: false,
        awardedSevenDayXP: false,
      };
    }

    const dayDifference = lastActiveDate
      ? getDayDifference(lastActiveDate, today)
      : null;

    const continuedStreak = dayDifference === 1;
    const streakBroken =
      lastActiveDate !== null && dayDifference !== null && dayDifference > 1;

    const currentStreak = continuedStreak ? previousStreak + 1 : 1;
    const bestStreak = Math.max(previousBestStreak, currentStreak);
    const isNewRecord = bestStreak > previousBestStreak;

    transaction.update(userRef, {
      streak: currentStreak,
      bestStreak,
      lastActiveDate: today,
      updatedAt: serverTimestamp(),
    });

    return {
      currentStreak,
      previousStreak,
      bestStreak,
      streakBroken,
      isNewRecord,
      alreadyCheckedToday: false,
      updatedToday: true,
      awardedSevenDayXP: false,
    };
  });

  if (
    streakResult.updatedToday &&
    streakResult.currentStreak === SEVEN_DAY_STREAK_TARGET
  ) {
    const xpResult = await addXP(userId, XP_REWARDS.SEVEN_DAY_STREAK, {
      reason: 'seven_day_streak',
      eventId: buildXPEventId('seven_day_streak', today),
      metadata: {
        date: today,
        streak: streakResult.currentStreak,
      },
    });

    return {
      ...streakResult,
      awardedSevenDayXP: xpResult.xpAdded > 0,
      xpResult,
    };
  }

  return streakResult;
};