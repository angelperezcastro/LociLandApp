// src/services/xpService.ts

import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { useLevelUpStore } from '../store/useLevelUpStore';
import { getLevelFromXP, getLevelTitle } from '../utils/levelUtils';
import { db } from './firebase';

export type XPGrantReason =
  | 'create_palace'
  | 'add_station'
  | 'complete_review'
  | 'perfect_review'
  | 'seven_day_streak'
  | 'achievement';

export type XPMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface AddXPOptions {
  reason: XPGrantReason;
  eventId: string;
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

const MAX_XP_GRANT = 500;

const getSafeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
};

const cleanMetadata = (
  metadata?: XPMetadata,
): Record<string, string | number | boolean | null> => {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean | null>;
};

const assertValidXPInput = (
  userId: string,
  amount: number,
  options: AddXPOptions,
): number => {
  if (!userId.trim()) {
    throw new Error('addXP failed: userId is required.');
  }

  if (!options.reason) {
    throw new Error('addXP failed: reason is required.');
  }

  if (!options.eventId?.trim()) {
    throw new Error('addXP failed: eventId is required for idempotency.');
  }

  const xpToAdd = getSafeNumber(amount);

  if (xpToAdd <= 0) {
    throw new Error('addXP failed: amount must be greater than 0.');
  }

  if (xpToAdd > MAX_XP_GRANT) {
    throw new Error(`addXP failed: amount cannot exceed ${MAX_XP_GRANT}.`);
  }

  return xpToAdd;
};

export const buildXPEventId = (
  reason: XPGrantReason,
  entityId: string,
): string => {
  const safeEntityId = entityId.trim().replace(/[^A-Za-z0-9_-]/g, '_');

  if (!safeEntityId) {
    throw new Error('buildXPEventId failed: entityId is required.');
  }

  return `${reason}_${safeEntityId}`;
};

export const addXP = async (
  userId: string,
  amount: number,
  options: AddXPOptions,
): Promise<AddXPResult> => {
  const xpToAdd = assertValidXPInput(userId, amount, options);

  const userRef = doc(db, 'users', userId);
  const xpEventRef = doc(db, 'users', userId, 'xpEvents', options.eventId);

  const result = await runTransaction(db, async (transaction) => {
    const eventSnapshot = await transaction.get(xpEventRef);
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(`addXP failed: user profile "${userId}" does not exist.`);
    }

    const userData = userSnapshot.data();

    const previousXP = getSafeNumber(userData.xp);
    const previousLevel = getSafeNumber(
      userData.level,
      getLevelFromXP(previousXP),
    );

    if (eventSnapshot.exists()) {
      return {
        previousXP,
        newXP: previousXP,
        previousLevel,
        newLevel: previousLevel,
        leveledUp: false,
        xpAdded: 0,
        levelTitle: getLevelTitle(previousLevel),
        alreadyAwarded: true,
      } satisfies AddXPResult;
    }

    const newXP = previousXP + xpToAdd;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > previousLevel;
    const levelTitle = getLevelTitle(newLevel);

    transaction.set(xpEventRef, {
      eventId: options.eventId,
      userId,
      reason: options.reason,
      amount: xpToAdd,
      previousXP,
      newXP,
      previousLevel,
      newLevel,
      levelTitle,
      leveledUp,
      metadata: cleanMetadata(options.metadata),
      createdAt: serverTimestamp(),
    });

    transaction.update(userRef, {
      xp: newXP,
      level: newLevel,
      levelTitle,
      updatedAt: serverTimestamp(),
      lastXPGrantAt: serverTimestamp(),
    });

    return {
      previousXP,
      newXP,
      previousLevel,
      newLevel,
      leveledUp,
      xpAdded: xpToAdd,
      levelTitle,
      alreadyAwarded: false,
    } satisfies AddXPResult;
  });

  if (result.leveledUp && !result.alreadyAwarded) {
    useLevelUpStore.getState().showLevelUp({
      previousLevel: result.previousLevel,
      newLevel: result.newLevel,
      newXP: result.newXP,
      levelTitle: result.levelTitle,
    });
  }

  return result;
};