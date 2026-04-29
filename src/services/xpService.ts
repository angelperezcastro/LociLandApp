// src/services/xpService.ts

import {
  doc,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';

import { db } from './firebase';
import { getLevelFromXP, getLevelTitle } from '../utils/levelUtils';

export type XPGrantReason =
  | 'create_palace'
  | 'add_station'
  | 'complete_review'
  | 'perfect_review'
  | 'seven_day_streak'
  | 'achievement';

export type XPMetadata = Record<string, string | number | boolean | null>;

export interface AddXPOptions {
  reason?: XPGrantReason;
  eventId?: string;
  metadata?: XPMetadata;
}

export interface AddXPResult {
  previousXP: number;
  newXP: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  xpAdded: number;
  levelTitle: string;
  alreadyAwarded: boolean;
}

const getSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const cleanMetadata = (metadata?: XPMetadata): XPMetadata => {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  ) as XPMetadata;
};

export const buildXPEventId = (reason: XPGrantReason, entityId: string): string => {
  return `${reason}_${entityId}`;
};

export const addXP = async (
  userId: string,
  amount: number,
  options: AddXPOptions = {},
): Promise<AddXPResult> => {
  if (!userId.trim()) {
    throw new Error('addXP failed: userId is required.');
  }

  const xpToAdd = getSafeNumber(amount);

  if (xpToAdd <= 0) {
    throw new Error('addXP failed: amount must be greater than 0.');
  }

  const userRef = doc(db, 'users', userId);
  const xpEventRef: DocumentReference | null = options.eventId
    ? doc(db, 'users', userId, 'xpEvents', options.eventId)
    : null;

  return runTransaction(db, async transaction => {
    const eventSnapshot = xpEventRef ? await transaction.get(xpEventRef) : null;
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(`addXP failed: user profile "${userId}" does not exist.`);
    }

    const userData = userSnapshot.data();

    const previousXP = getSafeNumber(userData.xp);
    const previousLevel = getLevelFromXP(previousXP);

    if (eventSnapshot?.exists()) {
      return {
        previousXP,
        newXP: previousXP,
        previousLevel,
        newLevel: previousLevel,
        leveledUp: false,
        xpAdded: 0,
        levelTitle: getLevelTitle(previousLevel),
        alreadyAwarded: true,
      };
    }

    const newXP = previousXP + xpToAdd;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > previousLevel;
    const levelTitle = getLevelTitle(newLevel);

    transaction.update(userRef, {
      xp: newXP,
      level: newLevel,
      levelTitle,
      updatedAt: serverTimestamp(),
      lastXPGrantAt: serverTimestamp(),
    });

    if (xpEventRef) {
      transaction.set(xpEventRef, {
        reason: options.reason ?? 'achievement',
        amount: xpToAdd,
        previousXP,
        newXP,
        previousLevel,
        newLevel,
        leveledUp,
        metadata: cleanMetadata(options.metadata),
        createdAt: serverTimestamp(),
      });
    }

    return {
      previousXP,
      newXP,
      previousLevel,
      newLevel,
      leveledUp,
      xpAdded: xpToAdd,
      levelTitle,
      alreadyAwarded: false,
    };
  });
};