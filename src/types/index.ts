export type AgeGroup = '6-9' | '10-14';

export interface Palace {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  createdAt: string;
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
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarEmoji: string;
  ageGroup: AgeGroup;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
}

export interface ReviewSession {
  id: string;
  palaceId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  xpEarned: number;
}