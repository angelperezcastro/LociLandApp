// src/utils/levelUtils.ts

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
  6: 1400,
  7: 2000,
  8: 2700,
  9: 3500,
  10: 5000,
} as const;

export type Level = keyof typeof LEVEL_THRESHOLDS;

export const XP_REWARDS = {
  CREATE_PALACE: 25,
  ADD_STATION: 10,
  COMPLETE_REVIEW: 20,
  PERFECT_REVIEW: 50,
  SEVEN_DAY_STREAK: 100,
} as const;

const LEVEL_TITLES: Record<Level, string> = {
  1: 'Memory Seedling 🌱',
  2: 'Memory Seedling 🌱',
  3: 'Palace Explorer 🗺️',
  4: 'Palace Explorer 🗺️',
  5: 'Memory Knight ⚔️',
  6: 'Memory Knight ⚔️',
  7: 'Palace Wizard 🧙',
  8: 'Palace Wizard 🧙',
  9: 'Palace Wizard 🧙',
  10: 'Memory Master 👑',
};

const normaliseXP = (xp: number): number => {
  if (!Number.isFinite(xp)) {
    return 0;
  }

  return Math.max(0, Math.floor(xp));
};

const clampLevel = (level: number): Level => {
  if (!Number.isFinite(level)) {
    return MIN_LEVEL;
  }

  const roundedLevel = Math.floor(level);

  if (roundedLevel <= MIN_LEVEL) {
    return MIN_LEVEL;
  }

  if (roundedLevel >= MAX_LEVEL) {
    return MAX_LEVEL;
  }

  return roundedLevel as Level;
};

export const getLevelFromXP = (xp: number): Level => {
  const safeXP = normaliseXP(xp);

  for (let level = MAX_LEVEL; level >= MIN_LEVEL; level -= 1) {
    const typedLevel = level as Level;

    if (safeXP >= LEVEL_THRESHOLDS[typedLevel]) {
      return typedLevel;
    }
  }

  return MIN_LEVEL;
};

export const getXpForNextLevel = (level: number): number | null => {
  const safeLevel = clampLevel(level);

  if (safeLevel >= MAX_LEVEL) {
    return null;
  }

  const nextLevel = (safeLevel + 1) as Level;

  return LEVEL_THRESHOLDS[nextLevel];
};

export const getLevelTitle = (level: number): string => {
  const safeLevel = clampLevel(level);

  return LEVEL_TITLES[safeLevel];
};

export const getProgressPercent = (xp: number): number => {
  const safeXP = normaliseXP(xp);
  const currentLevel = getLevelFromXP(safeXP);

  if (currentLevel >= MAX_LEVEL) {
    return 100;
  }

  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel];
  const nextLevelXP = LEVEL_THRESHOLDS[(currentLevel + 1) as Level];

  const xpInsideCurrentLevel = safeXP - currentLevelXP;
  const xpNeededForCurrentLevel = nextLevelXP - currentLevelXP;

  if (xpNeededForCurrentLevel <= 0) {
    return 100;
  }

  const rawPercent = (xpInsideCurrentLevel / xpNeededForCurrentLevel) * 100;

  return Math.min(100, Math.max(0, Math.round(rawPercent)));
};

export const getXpRemainingForNextLevel = (xp: number): number => {
  const safeXP = normaliseXP(xp);
  const currentLevel = getLevelFromXP(safeXP);
  const nextLevelXP = getXpForNextLevel(currentLevel);

  if (nextLevelXP === null) {
    return 0;
  }

  return Math.max(0, nextLevelXP - safeXP);
};