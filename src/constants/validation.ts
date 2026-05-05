// src/constants/validation.ts

/**
 * Central validation source for the client-side TypeScript code.
 *
 * Keep these values aligned with firestore.rules. Firebase Rules cannot import
 * TypeScript constants, so every rules change affecting these limits must be
 * mirrored here and vice versa.
 */
export const VALIDATION_LIMITS = {
  auth: {
    passwordMinLength: 6,
  },
  user: {
    displayNameMaxLength: 40,
    emailMaxLength: 254,
    avatarEmojiMaxLength: 16,
    minLevel: 1,
    maxLevel: 10,
    maxXP: 100_000,
    maxStreakDays: 3_650,
    levelTitleMaxLength: 80,
    xpEventIdMaxLength: 160,
  },
  palace: {
    nameMaxLength: 40,
    minStationCount: 0,
    maxStationCount: 20,
  },
  station: {
    minOrder: 0,
    maxOrder: 20,
    labelMaxLength: 40,
    emojiMaxLength: 16,
    memoryTextMaxLength: 500,
    imageUriMaxLength: 2_048,
    maxImageSizeBytes: 2 * 1024 * 1024,
  },
  review: {
    minStations: 2,
    maxStations: 20,
    maxDurationSeconds: 86_400,
  },
  stats: {
    maxPalaces: 1_000,
    maxStations: 20_000,
    maxReviewSessions: 100_000,
    maxAnswers: 2_000_000,
    maxReviewDateStrings: 5_000,
  },
} as const;

export const AGE_GROUP_VALUES = ['6-9', '10-14'] as const;

export const PALACE_TEMPLATE_IDS = [
  'my-home',
  'magic-castle',
  'enchanted-forest',
  'space-station',
  'underwater-world',
  'dinosaur-island',
] as const;

export const AVATAR_EMOJI_OPTIONS = [
  '🦊',
  '🐸',
  '🦁',
  '🐼',
  '🦋',
  '🐉',
  '🦄',
  '🐬',
] as const;

export const SUPPORTED_STATION_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const FIREBASE_STORAGE_DOWNLOAD_URL_PREFIX =
  'https://firebasestorage.googleapis.com/';

export type AgeGroupValue = (typeof AGE_GROUP_VALUES)[number];
export type PalaceTemplateIdValue = (typeof PALACE_TEMPLATE_IDS)[number];
export type AvatarEmojiValue = (typeof AVATAR_EMOJI_OPTIONS)[number];
export type StationImageContentType =
  (typeof SUPPORTED_STATION_IMAGE_CONTENT_TYPES)[number];

export const trimText = (value: string): string => value.trim();

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const isNonEmptyTrimmedString = (value: string): boolean =>
  value.trim().length > 0;

export const isLengthAtMost = (value: string, maxLength: number): boolean =>
  value.length <= maxLength;

export const isValidEmail = (email: string): boolean => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || normalizedEmail.length > VALIDATION_LIMITS.user.emailMaxLength) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
};

export const isValidAgeGroup = (value: unknown): value is AgeGroupValue => {
  return (
    typeof value === 'string' &&
    (AGE_GROUP_VALUES as readonly string[]).includes(value)
  );
};

export const isValidPalaceTemplateId = (
  value: unknown,
): value is PalaceTemplateIdValue => {
  return (
    typeof value === 'string' &&
    (PALACE_TEMPLATE_IDS as readonly string[]).includes(value)
  );
};

export const isValidAvatarEmoji = (
  value: unknown,
): value is AvatarEmojiValue => {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= VALIDATION_LIMITS.user.avatarEmojiMaxLength
  );
};

export const normalizeDisplayName = (
  displayName: string | undefined,
  fallback: string,
): string => {
  const trimmedDisplayName = displayName?.trim() ?? '';

  if (!trimmedDisplayName) {
    return fallback;
  }

  return trimmedDisplayName.slice(
    0,
    VALIDATION_LIMITS.user.displayNameMaxLength,
  );
};

export const normalizePalaceName = (name: string): string => {
  const trimmedName = trimText(name);

  if (!trimmedName) {
    throw new Error('Palace name cannot be empty.');
  }

  if (trimmedName.length > VALIDATION_LIMITS.palace.nameMaxLength) {
    throw new Error(
      `Palace name cannot be longer than ${VALIDATION_LIMITS.palace.nameMaxLength} characters.`,
    );
  }

  return trimmedName;
};

export const assertNonEmptyId = (value: string, fieldName: string): void => {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

export const assertValidStationOrder = (order: number): void => {
  if (
    !Number.isInteger(order) ||
    order < VALIDATION_LIMITS.station.minOrder ||
    order > VALIDATION_LIMITS.station.maxOrder
  ) {
    throw new Error(
      `stationService: station order must be between ${VALIDATION_LIMITS.station.minOrder} and ${VALIDATION_LIMITS.station.maxOrder}.`,
    );
  }
};

export const normalizeStationLabel = (label: string): string => {
  const trimmedLabel = trimText(label);

  if (!trimmedLabel) {
    throw new Error('stationService: station label is required.');
  }

  if (trimmedLabel.length > VALIDATION_LIMITS.station.labelMaxLength) {
    throw new Error(
      `stationService: station label cannot be longer than ${VALIDATION_LIMITS.station.labelMaxLength} characters.`,
    );
  }

  return trimmedLabel;
};

export const normalizeStationEmoji = (emoji: string): string => {
  const trimmedEmoji = trimText(emoji);

  if (!trimmedEmoji) {
    throw new Error('stationService: station emoji is required.');
  }

  if (trimmedEmoji.length > VALIDATION_LIMITS.station.emojiMaxLength) {
    throw new Error('stationService: station emoji is too long.');
  }

  return trimmedEmoji;
};

export const normalizeStationMemoryText = (
  memoryText?: string,
): string => {
  const trimmedMemoryText = memoryText?.trim() ?? '';

  if (trimmedMemoryText.length > VALIDATION_LIMITS.station.memoryTextMaxLength) {
    throw new Error(
      `stationService: memory text cannot be longer than ${VALIDATION_LIMITS.station.memoryTextMaxLength} characters.`,
    );
  }

  return trimmedMemoryText;
};

export const isValidFirebaseStorageImageUri = (imageUri: string): boolean => {
  return (
    imageUri.length <= VALIDATION_LIMITS.station.imageUriMaxLength &&
    imageUri.startsWith(FIREBASE_STORAGE_DOWNLOAD_URL_PREFIX)
  );
};

export const assertValidStationImageUri = (
  imageUri?: string | null,
): void => {
  if (!imageUri) {
    return;
  }

  if (imageUri.length > VALIDATION_LIMITS.station.imageUriMaxLength) {
    throw new Error('stationService: imageUri is too long.');
  }

  if (!imageUri.startsWith(FIREBASE_STORAGE_DOWNLOAD_URL_PREFIX)) {
    throw new Error('stationService: imageUri must be a Firebase Storage URL.');
  }
};

export const assertValidReviewStationCount = (totalStations: number): void => {
  if (totalStations < VALIDATION_LIMITS.review.minStations) {
    throw new Error(
      `A palace needs at least ${VALIDATION_LIMITS.review.minStations} stations to start a review.`,
    );
  }

  if (totalStations > VALIDATION_LIMITS.review.maxStations) {
    throw new Error(
      `A review cannot contain more than ${VALIDATION_LIMITS.review.maxStations} stations.`,
    );
  }
};

export const isSupportedStationImageContentType = (
  contentType: string,
): contentType is StationImageContentType => {
  return (SUPPORTED_STATION_IMAGE_CONTENT_TYPES as readonly string[]).includes(
    contentType,
  );
};
