import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from './firebase';
import type { AgeGroup, AvatarEmoji, UserProfile } from '../types/user';

type CreateUserProfileInput = {
  uid: string;
  displayName: string;
  email: string;
  avatarEmoji: AvatarEmoji;
  ageGroup: AgeGroup;
};

type EnsureUserProfileInput = {
  uid: string;
  email: string;
  displayName?: string;
  avatarEmoji?: AvatarEmoji;
  ageGroup?: AgeGroup;
};

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: input.uid,
    displayName: input.displayName,
    email: input.email,
    avatarEmoji: input.avatarEmoji,
    ageGroup: input.ageGroup,
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: getTodayDateString(),
  };

  await setDoc(doc(db, 'users', input.uid), profile);

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function ensureUserProfile(
  input: EnsureUserProfileInput
): Promise<UserProfile> {
  const existing = await getUserProfile(input.uid);

  if (existing) {
    return existing;
  }

  return createUserProfile({
    uid: input.uid,
    email: input.email,
    displayName: input.displayName?.trim() || 'Explorer',
    avatarEmoji: input.avatarEmoji ?? '🦊',
    ageGroup: input.ageGroup ?? '10-14',
  });
}