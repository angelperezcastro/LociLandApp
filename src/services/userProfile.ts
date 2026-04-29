// src/services/userProfile.ts

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { getLevelTitle } from '../utils/levelUtils';
import type { AgeGroup, AvatarEmoji, UserProfile } from '../types/user';
import { db } from './firebase';

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

type UpdateUserProfileInput = Partial<
  Pick<
    UserProfile,
    | 'displayName'
    | 'avatarEmoji'
    | 'ageGroup'
    | 'xp'
    | 'level'
    | 'levelTitle'
    | 'streak'
    | 'lastActiveDate'
  >
>;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialUserLevel() {
  return 1;
}

export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<UserProfile> {
  const initialLevel = getInitialUserLevel();

  const profile: UserProfile = {
    uid: input.uid,
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    avatarEmoji: input.avatarEmoji,
    ageGroup: input.ageGroup,
    xp: 0,
    level: initialLevel,
    levelTitle: getLevelTitle(initialLevel),
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
  input: EnsureUserProfileInput,
): Promise<UserProfile> {
  const existing = await getUserProfile(input.uid);

  if (existing) {
    const resolvedLevel =
      typeof existing.level === 'number' && Number.isFinite(existing.level)
        ? existing.level
        : getInitialUserLevel();

    const resolvedLevelTitle =
      existing.levelTitle ?? getLevelTitle(resolvedLevel);

    if (!existing.levelTitle) {
      await updateDoc(doc(db, 'users', input.uid), {
        level: resolvedLevel,
        levelTitle: resolvedLevelTitle,
      });
    }

    return {
      ...existing,
      level: resolvedLevel,
      levelTitle: resolvedLevelTitle,
    };
  }

  return createUserProfile({
    uid: input.uid,
    email: input.email,
    displayName: input.displayName?.trim() || 'Explorer',
    avatarEmoji: input.avatarEmoji ?? '🦊',
    ageGroup: input.ageGroup ?? '10-14',
  });
}

export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileInput,
): Promise<void> {
  const payload: UpdateUserProfileInput = {
    ...data,
  };

  if (typeof data.level === 'number') {
    payload.levelTitle = data.levelTitle ?? getLevelTitle(data.level);
  }

  await updateDoc(doc(db, 'users', uid), payload);
}