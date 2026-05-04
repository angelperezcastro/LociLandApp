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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { isPalaceTemplateId } from '../assets/templates';
import type { Palace, PalaceTemplateId } from '../types';
import { XP_REWARDS } from '../utils/levelUtils';
import { checkAchievements } from './achievementService';
import { db } from './firebase';
import { addXP, buildXPEventId } from './xpService';

const getPalacesCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'palaces');
};

const getPalaceDocRef = (userId: string, palaceId: string) => {
  return doc(db, 'users', userId, 'palaces', palaceId);
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

/**
 * Temporary compatibility layer until P0-04 is solved.
 *
 * P0-01 correctly blocks direct client-side writes to user XP/level/streak.
 * Therefore, XP side effects must not make palace creation fail.
 *
 * The actual secure XP flow must be handled in P0-04 through a hardened,
 * idempotent flow, ideally Cloud Functions or stricter xpEvents-based rules.
 */
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
      console.warn(
        'XP grant after palace creation was skipped. This is expected until P0-04 is solved:',
        error,
      );
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

export const deletePalace = async (
  palaceId: string,
  userId: string,
): Promise<void> => {
  assertValidUserId(userId);
  assertValidPalaceId(palaceId);

  await deleteDoc(getPalaceDocRef(userId, palaceId));
};