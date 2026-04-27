import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Station } from '../types';

export interface CreateStationData {
  order: number;
  emoji: string;
  label: string;
  memoryText?: string;
  imageUri?: string;
}

export type UpdateStationData = Partial<CreateStationData>;

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

  const payload = {
    palaceId,
    userId,
    order: data.order,
    emoji,
    label,
    memoryText: data.memoryText?.trim() ?? '',
    ...(data.imageUri ? { imageUri: data.imageUri } : {}),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getStationsCollectionRef(userId, palaceId), payload);

  return {
    id: docRef.id,
    palaceId,
    userId,
    order: payload.order,
    emoji: payload.emoji,
    label: payload.label,
    memoryText: payload.memoryText,
    ...(payload.imageUri ? { imageUri: payload.imageUri } : {}),
    createdAt: serverTimestamp() as unknown as Timestamp,
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

  const payload: Partial<CreateStationData> = {};

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
    payload.imageUri = data.imageUri;
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

  await deleteDoc(getStationDocRef(userId, palaceId, stationId));
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