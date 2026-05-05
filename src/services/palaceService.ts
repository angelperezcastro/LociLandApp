// src/services/palaceService.ts

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { isPalaceTemplateId } from '../assets/templates';
import type { Palace, PalaceTemplateId } from '../types';
import { XP_REWARDS } from '../utils/levelUtils';
import { checkAchievements } from './achievementService';
import { db } from './firebase';
import { deleteStationImage } from './storageService';
import { addXP, buildXPEventId } from './xpService';

const FIRESTORE_BATCH_LIMIT = 450;

type PalaceDescendants = {
  answerRefs: DocumentReference<DocumentData>[];
  reviewSessionRefs: DocumentReference<DocumentData>[];
  stationRefs: DocumentReference<DocumentData>[];
  stationImageUris: string[];
};

const getPalacesCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'palaces');
};

const getPalaceDocRef = (userId: string, palaceId: string) => {
  return doc(db, 'users', userId, 'palaces', palaceId);
};

const getStationsCollectionRef = (userId: string, palaceId: string) => {
  return collection(db, 'users', userId, 'palaces', palaceId, 'stations');
};

const getReviewSessionsCollectionRef = (userId: string, palaceId: string) => {
  return collection(
    db,
    'users',
    userId,
    'palaces',
    palaceId,
    'reviewSessions',
  );
};

const getReviewAnswersCollectionRef = (
  userId: string,
  palaceId: string,
  sessionId: string,
) => {
  return collection(
    db,
    'users',
    userId,
    'palaces',
    palaceId,
    'reviewSessions',
    sessionId,
    'answers',
  );
};

const assertValidUserId = (userId: string) => {
  if (!userId.trim()) {
    throw new Error('A valid userId is required.');
  }
};

const assertValidPalaceId = (palaceId: string) => {
  if (!palaceId.trim()) {
    throw new Error('A valid palaceId is required.');
  }
};

const assertValidPalaceName = (name: string) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Palace name cannot be empty.');
  }

  if (trimmedName.length > 40) {
    throw new Error('Palace name cannot be longer than 40 characters.');
  }
};

const assertValidTemplateId = (templateId: PalaceTemplateId) => {
  if (!isPalaceTemplateId(templateId)) {
    throw new Error(`Invalid palace template id: ${templateId}`);
  }
};

const getImageUriFromStationData = (
  data?: DocumentData | Record<string, unknown>,
): string | undefined => {
  const imageUri = data?.imageUri;

  return typeof imageUri === 'string' && imageUri.trim()
    ? imageUri.trim()
    : undefined;
};

const collectUniqueStationImageUris = (
  stationDocs: QueryDocumentSnapshot<DocumentData>[],
): string[] => {
  const imageUris = new Set<string>();

  stationDocs.forEach((stationDoc) => {
    const imageUri = getImageUriFromStationData(stationDoc.data());

    if (imageUri) {
      imageUris.add(imageUri);
    }
  });

  return [...imageUris];
};

const deleteStationImagesSafely = async (
  imageUris: string[],
): Promise<void> => {
  if (imageUris.length === 0) {
    return;
  }

  const deletionResults = await Promise.allSettled(
    imageUris.map((imageUri) => deleteStationImage(imageUri)),
  );

  if (__DEV__) {
    deletionResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(
          'palaceService: station image cleanup failed during palace deletion.',
          {
            imageUri: imageUris[index],
            reason: result.reason,
          },
        );
      }
    });
  }
};

const grantCreatePalaceXPSafely = async (
  userId: string,
  palaceId: string,
  templateId: PalaceTemplateId,
): Promise<void> => {
  try {
    await addXP(userId, XP_REWARDS.CREATE_PALACE, {
      reason: 'create_palace',
      eventId: buildXPEventId('create_palace', palaceId),
      metadata: {
        palaceId,
        templateId,
      },
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('XP grant after palace creation was skipped:', error);
    }
  }
};

const checkAchievementsSafely = async (
  userId: string,
  palaceId: string,
  templateId: PalaceTemplateId,
): Promise<void> => {
  try {
    await checkAchievements(userId, {
      type: 'palace_created',
      palaceId,
      templateId,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'Achievement check after palace creation was skipped:',
        error,
      );
    }
  }
};

const mapPalaceDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Palace => {
  const data = snapshot.data();

  const templateId = data.templateId;

  if (typeof templateId !== 'string' || !isPalaceTemplateId(templateId)) {
    throw new Error(`Invalid templateId found in Firestore: ${templateId}`);
  }

  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    name: String(data.name ?? ''),
    templateId,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    stationCount:
      typeof data.stationCount === 'number' ? data.stationCount : 0,
  };
};

const commitDeleteBatch = async (
  refs: DocumentReference<DocumentData>[],
): Promise<void> => {
  if (refs.length === 0) {
    return;
  }

  for (let start = 0; start < refs.length; start += FIRESTORE_BATCH_LIMIT) {
    const chunk = refs.slice(start, start + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);

    chunk.forEach((ref) => {
      batch.delete(ref);
    });

    await batch.commit();
  }
};

const collectReviewAnswerRefs = async (
  userId: string,
  palaceId: string,
  sessionId: string,
): Promise<DocumentReference<DocumentData>[]> => {
  const answersSnapshot = await getDocs(
    getReviewAnswersCollectionRef(userId, palaceId, sessionId),
  );

  return answersSnapshot.docs.map((answerDoc) => answerDoc.ref);
};

const collectPalaceDescendantRefs = async (
  userId: string,
  palaceId: string,
): Promise<PalaceDescendants> => {
  const stationsSnapshot = await getDocs(
    getStationsCollectionRef(userId, palaceId),
  );

  const reviewSessionsSnapshot = await getDocs(
    getReviewSessionsCollectionRef(userId, palaceId),
  );

  const nestedAnswerRefs = await Promise.all(
    reviewSessionsSnapshot.docs.map((sessionDoc) =>
      collectReviewAnswerRefs(userId, palaceId, sessionDoc.id),
    ),
  );

  return {
    answerRefs: nestedAnswerRefs.flat(),
    reviewSessionRefs: reviewSessionsSnapshot.docs.map(
      (sessionDoc) => sessionDoc.ref,
    ),
    stationRefs: stationsSnapshot.docs.map((stationDoc) => stationDoc.ref),
    stationImageUris: collectUniqueStationImageUris(stationsSnapshot.docs),
  };
};

export const createPalace = async (
  userId: string,
  name: string,
  templateId: PalaceTemplateId,
): Promise<Palace> => {
  assertValidUserId(userId);
  assertValidPalaceName(name);
  assertValidTemplateId(templateId);

  const trimmedName = name.trim();

  const docRef = await addDoc(getPalacesCollectionRef(userId), {
    userId,
    name: trimmedName,
    templateId,
    stationCount: 0,
    createdAt: serverTimestamp(),
  });

  await grantCreatePalaceXPSafely(userId, docRef.id, templateId);
  await checkAchievementsSafely(userId, docRef.id, templateId);

  const createdSnapshot = await getDoc(docRef);

  if (!createdSnapshot.exists()) {
    throw new Error('The palace was created but could not be read back.');
  }

  const data = createdSnapshot.data();

  return {
    id: createdSnapshot.id,
    userId,
    name: trimmedName,
    templateId,
    stationCount:
      typeof data.stationCount === 'number' ? data.stationCount : 0,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
  };
};

export const getPalaces = async (userId: string): Promise<Palace[]> => {
  assertValidUserId(userId);

  const palacesQuery = query(
    getPalacesCollectionRef(userId),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(palacesQuery);

  return snapshot.docs.map(mapPalaceDoc);
};

/**
 * Deletes a palace and all descendants controlled by the app.
 *
 * Deletion order matters:
 * 1. answers
 * 2. reviewSessions
 * 3. stations
 * 4. palace document
 * 5. station images in Firebase Storage
 *
 * Firestore does not delete subcollections automatically when a parent
 * document is deleted, so this client-side deep delete prevents orphaned
 * app data. Storage cleanup is performed after Firestore deletion and uses
 * Promise.allSettled so a missing/failing image does not leave Firestore
 * half-deleted.
 */
export const deletePalaceDeep = async (
  palaceId: string,
  userId: string,
): Promise<void> => {
  assertValidUserId(userId);
  assertValidPalaceId(palaceId);

  const palaceRef = getPalaceDocRef(userId, palaceId);
  const palaceSnapshot = await getDoc(palaceRef);

  if (!palaceSnapshot.exists()) {
    return;
  }

  const {
    answerRefs,
    reviewSessionRefs,
    stationRefs,
    stationImageUris,
  } = await collectPalaceDescendantRefs(userId, palaceId);

  await commitDeleteBatch(answerRefs);
  await commitDeleteBatch(reviewSessionRefs);
  await commitDeleteBatch(stationRefs);

  await deleteDoc(palaceRef);

  await deleteStationImagesSafely(stationImageUris);
};

export const deletePalace = async (
  palaceId: string,
  userId: string,
): Promise<void> => {
  await deletePalaceDeep(palaceId, userId);
};