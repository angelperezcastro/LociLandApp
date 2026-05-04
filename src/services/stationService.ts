// src/services/stationService.ts

import {
  collection,
  deleteField,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type FieldValue,
  type Timestamp,
} from 'firebase/firestore';

import type { Station } from '../types';
import { XP_REWARDS } from '../utils/levelUtils';
import { checkAchievements } from './achievementService';
import { db } from './firebase';
import { addXP, buildXPEventId } from './xpService';

export interface CreateStationData {
  order: number;
  emoji: string;
  label: string;
  memoryText?: string;
  imageUri?: string;
}

export type UpdateStationData = Partial<
  Omit<CreateStationData, 'imageUri'>
> & {
  imageUri?: string | null;
};

const getPalaceDocRef = (userId: string, palaceId: string) =>
  doc(db, 'users', userId, 'palaces', palaceId);

const getStationsCollectionRef = (userId: string, palaceId: string) =>
  collection(db, 'users', userId, 'palaces', palaceId, 'stations');

const getStationDocRef = (userId: string, palaceId: string, stationId: string) =>
  doc(db, 'users', userId, 'palaces', palaceId, 'stations', stationId);

const assertRequiredIds = (palaceId: string, userId: string) => {
  if (!palaceId.trim()) {
    throw new Error('stationService: palaceId is required.');
  }

  if (!userId.trim()) {
    throw new Error('stationService: userId is required.');
  }
};

const assertStationId = (stationId: string) => {
  if (!stationId.trim()) {
    throw new Error('stationService: stationId is required.');
  }
};

const assertValidOrder = (order: number) => {
  if (!Number.isInteger(order) || order < 0 || order > 20) {
    throw new Error('stationService: station order must be between 0 and 20.');
  }
};

const assertValidImageUri = (imageUri?: string) => {
  if (!imageUri) {
    return;
  }

  if (imageUri.length > 2048) {
    throw new Error('stationService: imageUri is too long.');
  }

  if (!imageUri.startsWith('https://firebasestorage.googleapis.com/')) {
    throw new Error('stationService: imageUri must be a Firebase Storage URL.');
  }
};

const mapStationDocument = (
  id: string,
  data: Record<string, unknown>,
): Station => ({
  id,
  palaceId: data.palaceId as string,
  userId: data.userId as string,
  order: data.order as number,
  emoji: data.emoji as string,
  label: data.label as string,
  memoryText: (data.memoryText as string | undefined) ?? '',
  imageUri: data.imageUri as string | undefined,
  createdAt: data.createdAt as Timestamp,
});

const isProbablyOfflineError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('offline') ||
    message.includes('unavailable') ||
    message.includes('network') ||
    message.includes('backend')
  );
};

/**
 * Temporary compatibility layer until P0-04 is solved.
 *
 * P0-01 correctly blocks direct client-side writes to user XP/level/streak.
 * Therefore, XP side effects must not make station creation fail.
 *
 * The secure XP flow must be solved later with hardened xpEvents rules,
 * idempotent writes, or preferably Cloud Functions.
 */
const awardCreateStationXPSafely = async (
  userId: string,
  palaceId: string,
  stationId: string,
): Promise<void> => {
  try {
    await addXP(userId, XP_REWARDS.ADD_STATION, {
      reason: 'add_station',
      eventId: buildXPEventId('add_station', stationId),
      metadata: {
        palaceId,
        stationId,
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'XP grant after station creation was skipped. This is expected until P0-04 is solved:',
        error,
      );
    }
  }
};

const checkAchievementsSafely = async ({
  userId,
  palaceId,
  stationId,
  hasImage,
}: {
  userId: string;
  palaceId: string;
  stationId: string;
  hasImage: boolean;
}): Promise<void> => {
  try {
    await checkAchievements(userId, {
      type: 'station_created',
      palaceId,
      stationId,
      hasImage,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'Achievement check after station creation was skipped:',
        error,
      );
    }
  }
};

export const createStation = async (
  palaceId: string,
  userId: string,
  data: CreateStationData,
): Promise<Station> => {
  assertRequiredIds(palaceId, userId);
  assertValidOrder(data.order);
  assertValidImageUri(data.imageUri);

  const label = data.label.trim();
  const emoji = data.emoji.trim();
  const memoryText = data.memoryText?.trim() ?? '';

  if (!label) {
    throw new Error('stationService: station label is required.');
  }

  if (label.length > 40) {
    throw new Error('stationService: station label cannot be longer than 40 characters.');
  }

  if (!emoji) {
    throw new Error('stationService: station emoji is required.');
  }

  if (emoji.length > 16) {
    throw new Error('stationService: station emoji is too long.');
  }

  if (memoryText.length > 500) {
    throw new Error('stationService: memory text cannot be longer than 500 characters.');
  }

  const stationRef = doc(getStationsCollectionRef(userId, palaceId));
  const palaceRef = getPalaceDocRef(userId, palaceId);
  const createdAt = serverTimestamp();

  const payload = {
    palaceId,
    userId,
    order: data.order,
    emoji,
    label,
    memoryText,
    ...(data.imageUri ? { imageUri: data.imageUri } : {}),
    createdAt,
  };

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(stationRef, payload);
      transaction.update(palaceRef, {
        stationCount: increment(1),
      });
    });
  } catch (error) {
    if (!isProbablyOfflineError(error)) {
      throw error;
    }

    const batch = writeBatch(db);

    batch.set(stationRef, payload);
    batch.update(palaceRef, {
      stationCount: increment(1),
    });

    await batch.commit();
  }

  await awardCreateStationXPSafely(userId, palaceId, stationRef.id);

  await checkAchievementsSafely({
    userId,
    palaceId,
    stationId: stationRef.id,
    hasImage: Boolean(payload.imageUri),
  });

  return {
    id: stationRef.id,
    palaceId,
    userId,
    order: payload.order,
    emoji: payload.emoji,
    label: payload.label,
    memoryText: payload.memoryText,
    ...(payload.imageUri ? { imageUri: payload.imageUri } : {}),
    createdAt: createdAt as unknown as Timestamp,
  };
};

export const getStations = async (
  palaceId: string,
  userId: string,
): Promise<Station[]> => {
  assertRequiredIds(palaceId, userId);

  const stationsQuery = query(
    getStationsCollectionRef(userId, palaceId),
    orderBy('order', 'asc'),
  );

  const snapshot = await getDocs(stationsQuery);

  return snapshot.docs.map((stationDoc) =>
    mapStationDocument(stationDoc.id, stationDoc.data()),
  );
};

export const updateStation = async (
  stationId: string,
  palaceId: string,
  userId: string,
  data: UpdateStationData,
): Promise<void> => {
  assertRequiredIds(palaceId, userId);
  assertStationId(stationId);

  const payload: Record<string, string | number | FieldValue> = {};

  if (data.order !== undefined) {
    assertValidOrder(data.order);
    payload.order = data.order;
  }

  if (data.emoji !== undefined) {
    const emoji = data.emoji.trim();

    if (!emoji) {
      throw new Error('stationService: station emoji cannot be empty.');
    }

    if (emoji.length > 16) {
      throw new Error('stationService: station emoji is too long.');
    }

    payload.emoji = emoji;
  }

  if (data.label !== undefined) {
    const label = data.label.trim();

    if (!label) {
      throw new Error('stationService: station label cannot be empty.');
    }

    if (label.length > 40) {
      throw new Error('stationService: station label cannot be longer than 40 characters.');
    }

    payload.label = label;
  }

  if (data.memoryText !== undefined) {
    const memoryText = data.memoryText.trim();

    if (memoryText.length > 500) {
      throw new Error('stationService: memory text cannot be longer than 500 characters.');
    }

    payload.memoryText = memoryText;
  }

  if (data.imageUri !== undefined) {
    if (data.imageUri === null) {
      payload.imageUri = deleteField();
    } else {
      assertValidImageUri(data.imageUri);
      payload.imageUri = data.imageUri;
    }
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  await updateDoc(getStationDocRef(userId, palaceId, stationId), payload);
};

export const deleteStation = async (
  stationId: string,
  palaceId: string,
  userId: string,
): Promise<void> => {
  assertRequiredIds(palaceId, userId);
  assertStationId(stationId);

  const stationRef = getStationDocRef(userId, palaceId, stationId);
  const palaceRef = getPalaceDocRef(userId, palaceId);

  try {
    await runTransaction(db, async (transaction) => {
      transaction.delete(stationRef);
      transaction.update(palaceRef, {
        stationCount: increment(-1),
      });
    });
  } catch (error) {
    if (!isProbablyOfflineError(error)) {
      throw error;
    }

    const batch = writeBatch(db);

    batch.delete(stationRef);
    batch.update(palaceRef, {
      stationCount: increment(-1),
    });

    await batch.commit();
  }
};

export const reorderStations = async (
  palaceId: string,
  userId: string,
  orderedIds: string[],
): Promise<void> => {
  assertRequiredIds(palaceId, userId);

  if (orderedIds.length === 0) {
    return;
  }

  const batch = writeBatch(db);

  orderedIds.forEach((stationId, index) => {
    assertStationId(stationId);
    assertValidOrder(index);

    const stationRef = getStationDocRef(userId, palaceId, stationId);
    batch.update(stationRef, { order: index });
  });

  await batch.commit();
};