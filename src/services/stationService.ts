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

const awardCreateStationXP = async (
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
    if (isProbablyOfflineError(error)) {
      return;
    }

    throw error;
  }
};

export const createStation = async (
  palaceId: string,
  userId: string,
  data: CreateStationData,
): Promise<Station> => {
  assertRequiredIds(palaceId, userId);

  const label = data.label.trim();
  const emoji = data.emoji.trim();

  if (!label) {
    throw new Error('stationService: station label is required.');
  }

  if (!emoji) {
    throw new Error('stationService: station emoji is required.');
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
    memoryText: data.memoryText?.trim() ?? '',
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

  await awardCreateStationXP(userId, palaceId, stationRef.id);

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
    payload.order = data.order;
  }

  if (data.emoji !== undefined) {
    const emoji = data.emoji.trim();

    if (!emoji) {
      throw new Error('stationService: station emoji cannot be empty.');
    }

    payload.emoji = emoji;
  }

  if (data.label !== undefined) {
    const label = data.label.trim();

    if (!label) {
      throw new Error('stationService: station label cannot be empty.');
    }

    payload.label = label;
  }

  if (data.memoryText !== undefined) {
    payload.memoryText = data.memoryText.trim();
  }

  if (data.imageUri !== undefined) {
    payload.imageUri = data.imageUri === null ? deleteField() : data.imageUri;
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

    const stationRef = getStationDocRef(userId, palaceId, stationId);
    batch.update(stationRef, { order: index });
  });

  await batch.commit();
};