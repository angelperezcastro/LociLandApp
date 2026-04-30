// src/utils/ageGroup.ts

import type { AgeGroup } from '../types/user';

export const DEFAULT_AGE_GROUP: AgeGroup = '6-9';

export function normalizeAgeGroup(
  value: unknown,
  fallback: AgeGroup = DEFAULT_AGE_GROUP,
): AgeGroup {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().replace('–', '-').replace('—', '-');

  if (normalized === '6-9') {
    return '6-9';
  }

  if (normalized === '10-14') {
    return '10-14';
  }

  return fallback;
}

export function isOlderAgeGroup(value: unknown): boolean {
  return normalizeAgeGroup(value) === '10-14';
}

export function isYoungerAgeGroup(value: unknown): boolean {
  return normalizeAgeGroup(value) === '6-9';
}