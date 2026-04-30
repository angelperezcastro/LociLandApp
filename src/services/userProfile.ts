// src/services/userProfile.ts

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
    | 'bestStreak'
    | 'lastActiveDate'
  >
>;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialUserLevel() {
  return 1;
}

function normalizeUserProfile(rawProfile: UserProfile): UserProfile {
  return {
    ...rawProfile,
    ageGroup: normalizeAgeGroup(rawProfile.ageGroup),
    level:
      typeof rawProfile.level === 'number' && Number.isFinite(rawProfile.level)
        ? rawProfile.level
        : getInitialUserLevel(),
    levelTitle:
      rawProfile.levelTitle ??
      getLevelTitle(
        typeof rawProfile.level === 'number' && Number.isFinite(rawProfile.level)
          ? rawProfile.level
          : getInitialUserLevel(),
      ),
    bestStreak:
      typeof rawProfile.bestStreak === 'number' &&
      Number.isFinite(rawProfile.bestStreak)
        ? rawProfile.bestStreak
        : rawProfile.streak,
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

  await setDoc(doc(db, 'users', input.uid), profile);

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

    const resolvedLevel =
      typeof existing.level === 'number' && Number.isFinite(existing.level)
        ? existing.level
        : getInitialUserLevel();

    const resolvedLevelTitle =
      existing.levelTitle ?? getLevelTitle(resolvedLevel);

    const resolvedBestStreak =
      typeof existing.bestStreak === 'number' &&
      Number.isFinite(existing.bestStreak)
        ? existing.bestStreak
        : existing.streak;

    const needsProfileBackfill =
      !existing.levelTitle ||
      existing.bestStreak === undefined ||
      existing.ageGroup !== normalizedAgeGroup;

    if (needsProfileBackfill) {
      await updateDoc(doc(db, 'users', input.uid), {
        ageGroup: normalizedAgeGroup,
        level: resolvedLevel,
        levelTitle: resolvedLevelTitle,
        bestStreak: resolvedBestStreak,
      });
    }

    return {
      ...existing,
      ageGroup: normalizedAgeGroup,
      level: resolvedLevel,
      levelTitle: resolvedLevelTitle,
      bestStreak: resolvedBestStreak,
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
  const payload: UpdateUserProfileInput = {
    ...data,
  };

  if (data.ageGroup) {
    payload.ageGroup = normalizeAgeGroup(data.ageGroup);
  }

  if (typeof data.level === 'number') {
    payload.levelTitle = data.levelTitle ?? getLevelTitle(data.level);
  }

  await updateDoc(doc(db, 'users', uid), payload);
}