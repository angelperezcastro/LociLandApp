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

import { db } from './firebase';
import type { Palace, PalaceTemplateId } from '../types';
import { isPalaceTemplateId } from '../assets/templates';

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

const assertValidPalaceName = (name: string) => {
  if (!name.trim()) {
    throw new Error('Palace name cannot be empty.');
  }

  if (name.trim().length > 40) {
    throw new Error('Palace name cannot be longer than 40 characters.');
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

  const trimmedName = name.trim();

  const docRef = await addDoc(getPalacesCollectionRef(userId), {
    userId,
    name: trimmedName,
    templateId,
    stationCount: 0,
    createdAt: serverTimestamp(),
  });

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

  if (!palaceId.trim()) {
    throw new Error('A valid palaceId is required.');
  }

  await deleteDoc(getPalaceDocRef(userId, palaceId));
};