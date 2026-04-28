import type { Timestamp } from 'firebase/firestore';

export type ReviewSessionStatus = 'active' | 'completed';

export interface ReviewSession {
  id: string;
  palaceId: string;
  userId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  xpEarned: number;
  status: ReviewSessionStatus;
}

export interface ReviewSessionDocument {
  palaceId: string;
  userId: string;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  xpEarned: number;
  status: ReviewSessionStatus;
}

export interface ReviewAnswer {
  id: string;
  sessionId: string;
  stationId: string;
  correct: boolean;
  answeredAt: Date | null;
}

export interface ReviewAnswerDocument {
  sessionId: string;
  stationId: string;
  correct: boolean;
  answeredAt: Timestamp;
}

export interface StartReviewInput {
  palaceId: string;
  userId: string;
  totalStations?: number;
}

export interface RecordAnswerInput {
  userId: string;
  palaceId: string;
  sessionId: string;
  stationId: string;
  correct: boolean;
}

export interface CompleteReviewInput {
  userId: string;
  palaceId: string;
  sessionId: string;
}