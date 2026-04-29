// src/types/index.ts

import type { Timestamp } from 'firebase/firestore';

export type AgeGroup = '6-9' | '10-14';

export type PalaceTemplateId =
  | 'my-home'
  | 'magic-castle'
  | 'enchanted-forest'
  | 'space-station'
  | 'underwater-world'
  | 'dinosaur-island';

export interface PalaceTemplate {
  id: PalaceTemplateId;
  name: string;
  emoji: string;
  description: string;
  backgroundColour: string;
}

export interface Palace {
  id: string;
  userId: string;
  name: string;
  templateId: PalaceTemplateId;
  createdAt: Timestamp;
  stationCount: number;
}

export interface Station {
  id: string;
  palaceId: string;
  userId: string;
  order: number;
  emoji: string;
  label: string;
  memoryText: string;
  imageUri?: string;
  createdAt: Timestamp;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarEmoji: string;
  ageGroup: AgeGroup;
  xp: number;
  level: number;
  levelTitle?: string;
  streak: number;
  lastActiveDate: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ReviewSession {
  id: string;
  palaceId: string;
  userId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp | null;
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  xpEarned: number;
}
