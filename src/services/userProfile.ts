// src/services/userProfile.ts

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import {
  isValidAvatarEmoji,
  normalizeDisplayName,
  normalizeEmail,
  VALIDATION_LIMITS,
} from '../constants/validation';
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
 * P0-01:
 * Only profile-editable fields are allowed here.
 * Do not add xp, level, levelTitle, streak, bestStreak or lastActiveDate.
 */
export type UpdateUserProfileInput = Partial<
  Pick<UserProfile, 'displayName' | 'avatarEmoji' | 'ageGroup'>
>;

const DEFAULT_DISPLAY_NAME = 'Explorer';
const DEFAULT_AVATAR_EMOJI = '🧠' as AvatarEmoji;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialUserLevel() {
  return 1;
}

function sanitizeDisplayName(displayName: string | undefined): string {
  return normalizeDisplayName(displayName, DEFAULT_DISPLAY_NAME);
}

function sanitizeEmail(email: string): string {
  return normalizeEmail(email);
}

function sanitizeAvatarEmoji(avatarEmoji: AvatarEmoji | undefined): AvatarEmoji {
  if (isValidAvatarEmoji(avatarEmoji)) {
    return avatarEmoji;
  }

  return DEFAULT_AVATAR_EMOJI;
}

function normalizeUserProfile(rawProfile: UserProfile): UserProfile {
  const resolvedLevel =
    typeof rawProfile.level === 'number' && Number.isFinite(rawProfile.level)
      ? rawProfile.level
      : getInitialUserLevel();

  const resolvedStreak =
    typeof rawProfile.streak === 'number' && Number.isFinite(rawProfile.streak)
      ? rawProfile.streak
      : 0;

  const resolvedBestStreak =
    typeof rawProfile.bestStreak === 'number' && Number.isFinite(rawProfile.bestStreak)
      ? rawProfile.bestStreak
      : resolvedStreak;

  return {
    ...rawProfile,
    displayName: sanitizeDisplayName(rawProfile.displayName),
    email: sanitizeEmail(rawProfile.email),
    ageGroup: normalizeAgeGroup(rawProfile.ageGroup),
    avatarEmoji: sanitizeAvatarEmoji(rawProfile.avatarEmoji),
    level: resolvedLevel,
    levelTitle: rawProfile.levelTitle ?? getLevelTitle(resolvedLevel),
    streak: resolvedStreak,
    bestStreak: resolvedBestStreak,
  };
}

export async function createUserProfile(
  input: CreateUserProfileInput,
): Promise<UserProfile> {
  const initialLevel = getInitialUserLevel();

  const profile: UserProfile = {
    uid: input.uid,
    displayName: sanitizeDisplayName(input.displayName),
    email: sanitizeEmail(input.email),
    avatarEmoji: sanitizeAvatarEmoji(input.avatarEmoji),
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
    const normalizedAvatarEmoji = sanitizeAvatarEmoji(existing.avatarEmoji);

    /**
     * Only backfill genuinely editable profile data.
     *
     * Do not backfill level, levelTitle, xp, streak, bestStreak or lastActiveDate
     * from the client. Those are calculated fields and P0-01/P0-04 intentionally
     * block arbitrary client-side writes.
     */
    const profilePatch: UpdateUserProfileInput & {
      updatedAt?: ReturnType<typeof serverTimestamp>;
    } = {};

    if (existing.ageGroup !== normalizedAgeGroup) {
      profilePatch.ageGroup = normalizedAgeGroup;
    }

    if (existing.avatarEmoji !== normalizedAvatarEmoji) {
      profilePatch.avatarEmoji = normalizedAvatarEmoji;
    }

    if (Object.keys(profilePatch).length > 0) {
      await updateDoc(doc(db, 'users', input.uid), {
        ...profilePatch,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      ...existing,
      ageGroup: normalizedAgeGroup,
      avatarEmoji: normalizedAvatarEmoji,
    };
  }

  return createUserProfile({
    uid: input.uid,
    email: input.email,
    displayName: sanitizeDisplayName(input.displayName),
    avatarEmoji: sanitizeAvatarEmoji(input.avatarEmoji ?? DEFAULT_AVATAR_EMOJI),
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

    if (displayName.length > VALIDATION_LIMITS.user.displayNameMaxLength) {
      throw new Error(
        `Display name cannot be longer than ${VALIDATION_LIMITS.user.displayNameMaxLength} characters.`,
      );
    }

    payload.displayName = displayName;
  }

  if (data.avatarEmoji !== undefined) {
    if (!isValidAvatarEmoji(data.avatarEmoji)) {
      throw new Error('Avatar emoji cannot be empty.');
    }

    payload.avatarEmoji = data.avatarEmoji;
  }

  if (data.ageGroup !== undefined) {
    payload.ageGroup = normalizeAgeGroup(data.ageGroup);
  }

  await updateDoc(doc(db, 'users', uid), payload);
}
