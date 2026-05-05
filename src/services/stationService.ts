// src/services/stationService.ts

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type FieldValue,
  type Timestamp,
} from 'firebase/firestore';

import {
  assertNonEmptyId,
  assertValidStationImageUri,
  assertValidStationOrder,
  normalizeStationEmoji,
  normalizeStationLabel,
  normalizeStationMemoryText,
} from '../constants/validation';
import type { Station } from '../types';
import { XP_REWARDS } from '../utils/levelUtils';
import { checkAchievements } from './achievementService';
import { db } from './firebase';
import { deleteStationImage } from './storageService';
import {
  recordStationCreated,
  recordStationDeleted,
  recordStationImageChanged,
} from './statsService';
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
  assertNonEmptyId(palaceId, 'stationService: palaceId');
  assertNonEmptyId(userId, 'stationService: userId');
};

const assertStationId = (stationId: string) => {
  assertNonEmptyId(stationId, 'stationService: stationId');
};

const getImageUriFromStationData = (
  data?: DocumentData | Record<string, unknown>,
): string | undefined => {
  const imageUri = data?.imageUri;

  return typeof imageUri === 'string' && imageUri.trim()
    ? imageUri
    : undefined;
};

const deleteStationImageSafely = async (
  imageUri?: string | null,
): Promise<void> => {
  if (!imageUri) {
    return;
  }

  try {
    await deleteStationImage(imageUri);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'stationService: station image cleanup failed after Firestore update.',
        error,
      );
    }
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
      console.warn('XP grant after station creation was skipped:', error);
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


const recordStationCreatedSafely = async (
  userId: string,
  hasImage: boolean,
): Promise<void> => {
  try {
    await recordStationCreated(userId, hasImage);
  } catch (error) {
    if (__DEV__) {
      console.warn('Stats update after station creation was skipped:', error);
    }
  }
};

const recordStationDeletedSafely = async (
  userId: string,
  hadImage: boolean,
): Promise<void> => {
  try {
    await recordStationDeleted(userId, hadImage);
  } catch (error) {
    if (__DEV__) {
      console.warn('Stats update after station deletion was skipped:', error);
    }
  }
};

const recordStationImageChangedSafely = async ({
  userId,
  previousHadImage,
  nextHadImage,
}: {
  userId: string;
  previousHadImage: boolean;
  nextHadImage: boolean;
}): Promise<void> => {
  try {
    await recordStationImageChanged(userId, {
      previousHadImage,
      nextHasImage: nextHadImage,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Stats update after station image change was skipped:', error);
    }
  }
};

export const createStation = async (
  palaceId: string,
  userId: string,
  data: CreateStationData,
): Promise<Station> => {
  assertRequiredIds(palaceId, userId);
  assertValidStationOrder(data.order);
  assertValidStationImageUri(data.imageUri);

  const label = normalizeStationLabel(data.label);
  const emoji = normalizeStationEmoji(data.emoji);
  const memoryText = normalizeStationMemoryText(data.memoryText);

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

  await recordStationCreatedSafely(userId, Boolean(payload.imageUri));
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

  const stationRef = getStationDocRef(userId, palaceId, stationId);
  const payload: Record<string, string | number | FieldValue> = {};

  if (data.order !== undefined) {
    assertValidStationOrder(data.order);
    payload.order = data.order;
  }

  if (data.emoji !== undefined) {
    payload.emoji = normalizeStationEmoji(data.emoji);
  }

  if (data.label !== undefined) {
    payload.label = normalizeStationLabel(data.label);
  }

  if (data.memoryText !== undefined) {
    payload.memoryText = normalizeStationMemoryText(data.memoryText);
  }

  let previousImageUri: string | undefined;

  if (data.imageUri !== undefined) {
    const stationSnapshot = await getDoc(stationRef);

    if (stationSnapshot.exists()) {
      previousImageUri = getImageUriFromStationData(stationSnapshot.data());
    }

    if (data.imageUri === null) {
      payload.imageUri = deleteField();
    } else {
      assertValidStationImageUri(data.imageUri);
      payload.imageUri = data.imageUri;
    }
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  await updateDoc(stationRef, payload);

  if (data.imageUri !== undefined) {
    const nextImageUri = data.imageUri ?? undefined;

    await recordStationImageChangedSafely({
      userId,
      previousHadImage: Boolean(previousImageUri),
      nextHadImage: Boolean(nextImageUri),
    });

    if (previousImageUri) {
      const imageWasRemovedOrReplaced = previousImageUri !== nextImageUri;

      if (imageWasRemovedOrReplaced) {
        await deleteStationImageSafely(previousImageUri);
      }
    }
  }
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

  let imageUriToDelete: string | undefined;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const stationSnapshot = await transaction.get(stationRef);

      if (!stationSnapshot.exists()) {
        return {
          deleted: false,
          imageUri: undefined,
        };
      }

      const imageUri = getImageUriFromStationData(stationSnapshot.data());

      transaction.delete(stationRef);
      transaction.update(palaceRef, {
        stationCount: increment(-1),
      });

      return {
        deleted: true,
        imageUri,
      };
    });

    if (!result.deleted) {
      return;
    }

    imageUriToDelete = result.imageUri;
  } catch (error) {
    if (!isProbablyOfflineError(error)) {
      throw error;
    }

    const cachedStationSnapshot = await getDoc(stationRef).catch(() => null);

    if (cachedStationSnapshot?.exists()) {
      imageUriToDelete = getImageUriFromStationData(
        cachedStationSnapshot.data(),
      );
    }

    const batch = writeBatch(db);

    batch.delete(stationRef);
    batch.update(palaceRef, {
      stationCount: increment(-1),
    });

    await batch.commit();
  }

  await recordStationDeletedSafely(userId, Boolean(imageUriToDelete));
  await deleteStationImageSafely(imageUriToDelete);
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
    assertValidStationOrder(index);

    const stationRef = getStationDocRef(userId, palaceId, stationId);
    batch.update(stationRef, { order: index });
  });

  await batch.commit();
};