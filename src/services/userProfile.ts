// src/services/userProfile.ts

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getLevelTitle } from '../utils/levelUtils';
import { normalizeAgeGroup } from '../utils/ageGroup';
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

/**
 * Deliberately restricted.
 *
 * Do not add xp, level, levelTitle, streak, bestStreak or lastActiveDate here.
 * Those are calculated fields and must not be editable through profile updates.
 */
export type UpdateUserProfileInput = Partial<
  Pick<UserProfile, 'displayName' | 'avatarEmoji' | 'ageGroup'>
>;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialUserLevel() {
  return 1;
}

function normalizeUserProfile(rawProfile: UserProfile): UserProfile {
  const resolvedLevel =
    typeof rawProfile.level === 'number' && Number.isFinite(rawProfile.level)
      ? rawProfile.level
      : getInitialUserLevel();

  const resolvedBestStreak =
    typeof rawProfile.bestStreak === 'number' &&
    Number.isFinite(rawProfile.bestStreak)
      ? rawProfile.bestStreak
      : rawProfile.streak;

  return {
    ...rawProfile,
    ageGroup: normalizeAgeGroup(rawProfile.ageGroup),
    level: resolvedLevel,
    levelTitle: rawProfile.levelTitle ?? getLevelTitle(resolvedLevel),
    bestStreak: resolvedBestStreak,
  };
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
    ageGroup: normalizeAgeGroup(input.ageGroup),
    xp: 0,
    level: initialLevel,
    levelTitle: getLevelTitle(initialLevel),
    streak: 0,
    bestStreak: 0,
    lastActiveDate: getTodayDateString(),
  };

  await setDoc(doc(db, 'users', input.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserProfile(snapshot.data() as UserProfile);
}

export async function ensureUserProfile(
  input: EnsureUserProfileInput,
): Promise<UserProfile> {
  const existing = await getUserProfile(input.uid);

  if (existing) {
    const normalizedAgeGroup = normalizeAgeGroup(existing.ageGroup);

    /**
     * Only backfill genuinely editable profile data.
     *
     * Do not backfill level, levelTitle, xp, streak or bestStreak from the client.
     * Those are calculated fields and P0-01 intentionally blocks client-side writes.
     */
    if (existing.ageGroup !== normalizedAgeGroup) {
      await updateDoc(doc(db, 'users', input.uid), {
        ageGroup: normalizedAgeGroup,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...existing,
      ageGroup: normalizedAgeGroup,
    };
  }

  return createUserProfile({
    uid: input.uid,
    email: input.email,
    displayName: input.displayName?.trim() || 'Explorer',
    avatarEmoji: input.avatarEmoji ?? '🦊',
    ageGroup: normalizeAgeGroup(input.ageGroup ?? '10-14'),
  });
}

export async function updateUserProfile(
  uid: string,
  data: UpdateUserProfileInput,
): Promise<void> {
  const payload: UpdateUserProfileInput & {
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    updatedAt: serverTimestamp(),
  };

  if (data.displayName !== undefined) {
    const displayName = data.displayName.trim();

    if (!displayName) {
      throw new Error('Display name cannot be empty.');
    }

    if (displayName.length > 40) {
      throw new Error('Display name cannot be longer than 40 characters.');
    }

    payload.displayName = displayName;
  }

  if (data.avatarEmoji !== undefined) {
    payload.avatarEmoji = data.avatarEmoji;
  }

  if (data.ageGroup !== undefined) {
    payload.ageGroup = normalizeAgeGroup(data.ageGroup);
  }

  await updateDoc(doc(db, 'users', uid), payload);
}