// src/services/reviewService.ts

import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import type {
  CompleteReviewInput,
  RecordAnswerInput,
  ReviewAnswer,
  ReviewAnswerDocument,
  ReviewSession,
  ReviewSessionDocument,
  StartReviewInput,
} from '../types/review';
import { XP_REWARDS } from '../utils/levelUtils';
import { checkAchievements } from './achievementService';
import { db } from './firebase';
import { addXP, buildXPEventId, type AddXPResult } from './xpService';

const USERS_COLLECTION = 'users';
const PALACES_COLLECTION = 'palaces';
const REVIEW_SESSIONS_COLLECTION = 'reviewSessions';
const REVIEW_ANSWERS_SUBCOLLECTION = 'answers';

type ReviewSessionExtraFields = ReviewSessionDocument & {
  isPerfect?: boolean;
  xpAppliedAt?: Timestamp;
};

const timestampToDate = (value: Timestamp | null | undefined): Date | null => {
  if (!value) return null;

  return value.toDate();
};

const getPalaceRef = (userId: string, palaceId: string) => {
  return doc(db, USERS_COLLECTION, userId, PALACES_COLLECTION, palaceId);
};

const getReviewSessionsCollectionRef = (userId: string, palaceId: string) => {
  return collection(
    db,
    USERS_COLLECTION,
    userId,
    PALACES_COLLECTION,
    palaceId,
    REVIEW_SESSIONS_COLLECTION,
  );
};

const getReviewSessionRef = (
  userId: string,
  palaceId: string,
  sessionId: string,
) => {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    PALACES_COLLECTION,
    palaceId,
    REVIEW_SESSIONS_COLLECTION,
    sessionId,
  );
};

const getReviewAnswerRef = (
  userId: string,
  palaceId: string,
  sessionId: string,
  stationId: string,
) => {
  return doc(
    db,
    USERS_COLLECTION,
    userId,
    PALACES_COLLECTION,
    palaceId,
    REVIEW_SESSIONS_COLLECTION,
    sessionId,
    REVIEW_ANSWERS_SUBCOLLECTION,
    stationId,
  );
};

const mapReviewSession = (
  id: string,
  data: ReviewSessionDocument,
): ReviewSession => {
  return {
    id,
    palaceId: data.palaceId,
    userId: data.userId,
    startedAt: timestampToDate(data.startedAt),
    completedAt: timestampToDate(data.completedAt),
    totalStations: data.totalStations,
    correctAnswers: data.correctAnswers,
    incorrectAnswers: data.incorrectAnswers,
    xpEarned: data.xpEarned,
    status: data.status,
    xpAppliedToUser: data.xpAppliedToUser ?? false,
  };
};

const mapReviewAnswer = (
  id: string,
  data: ReviewAnswerDocument,
): ReviewAnswer => {
  return {
    id,
    sessionId: data.sessionId,
    stationId: data.stationId,
    correct: data.correct,
    answeredAt: timestampToDate(data.answeredAt),
  };
};

const assertRequiredReviewIds = ({
  userId,
  palaceId,
  sessionId,
}: {
  userId: string;
  palaceId: string;
  sessionId?: string;
}) => {
  if (!userId.trim()) {
    throw new Error('userId is required.');
  }

  if (!palaceId.trim()) {
    throw new Error('palaceId is required.');
  }

  if (sessionId !== undefined && !sessionId.trim()) {
    throw new Error('sessionId is required.');
  }
};

const isCompleteReview = ({
  totalStations,
  correctAnswers,
  incorrectAnswers,
}: {
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
}): boolean => {
  const answeredStations = correctAnswers + incorrectAnswers;

  return totalStations > 0 && answeredStations >= totalStations;
};

const isPerfectReview = ({
  totalStations,
  correctAnswers,
  incorrectAnswers,
}: {
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
}): boolean => {
  return (
    isCompleteReview({ totalStations, correctAnswers, incorrectAnswers }) &&
    correctAnswers === totalStations &&
    incorrectAnswers === 0
  );
};

const calculateReviewXp = ({
  totalStations,
  correctAnswers,
  incorrectAnswers,
}: {
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
}): number => {
  if (!isCompleteReview({ totalStations, correctAnswers, incorrectAnswers })) {
    return 0;
  }

  return (
    XP_REWARDS.COMPLETE_REVIEW +
    (isPerfectReview({ totalStations, correctAnswers, incorrectAnswers })
      ? XP_REWARDS.PERFECT_REVIEW
      : 0)
  );
};

const getReviewDurationSeconds = (
  startedAt: Timestamp | null,
  completedAt: Date,
): number | null => {
  if (!startedAt) {
    return null;
  }

  const durationMs = completedAt.getTime() - startedAt.toDate().getTime();

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return null;
  }

  return Math.floor(durationMs / 1000);
};

const getPalaceStationCount = async (
  userId: string,
  palaceId: string,
): Promise<number> => {
  const palaceRef = getPalaceRef(userId, palaceId);
  const palaceSnap = await getDoc(palaceRef);

  if (!palaceSnap.exists()) {
    throw new Error('Palace not found.');
  }

  const palaceData = palaceSnap.data();
  const stationCount = palaceData.stationCount;

  if (typeof stationCount !== 'number') {
    return 0;
  }

  return stationCount;
};

const checkAchievementsSafely = async ({
  userId,
  palaceId,
  sessionId,
  isPerfect,
  durationSeconds,
  correctAnswers,
  totalStations,
  xpEarned,
}: {
  userId: string;
  palaceId: string;
  sessionId: string;
  isPerfect: boolean;
  durationSeconds: number | null;
  correctAnswers: number;
  totalStations: number;
  xpEarned: number;
}): Promise<void> => {
  try {
    await checkAchievements(userId, {
      type: 'review_completed',
      palaceId,
      sessionId,
      isPerfect,
      durationSeconds,
      correctAnswers,
      totalStations,
      xpEarned,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Achievement check after review completion failed:', error);
    }
  }
};

const awardReviewXPSafely = async ({
  userId,
  palaceId,
  sessionId,
  totalStations,
  correctAnswers,
  incorrectAnswers,
  isPerfect,
}: {
  userId: string;
  palaceId: string;
  sessionId: string;
  totalStations: number;
  correctAnswers: number;
  incorrectAnswers: number;
  isPerfect: boolean;
}): Promise<{ applied: boolean; results: AddXPResult[] }> => {
  const results: AddXPResult[] = [];

  try {
    const completeReviewResult = await addXP(
      userId,
      XP_REWARDS.COMPLETE_REVIEW,
      {
        reason: 'complete_review',
        eventId: buildXPEventId('complete_review', sessionId),
        metadata: {
          palaceId,
          sessionId,
          totalStations,
          correctAnswers,
          incorrectAnswers,
        },
      },
    );

    results.push(completeReviewResult);

    if (isPerfect) {
      const perfectReviewResult = await addXP(
        userId,
        XP_REWARDS.PERFECT_REVIEW,
        {
          reason: 'perfect_review',
          eventId: buildXPEventId('perfect_review', sessionId),
          metadata: {
            palaceId,
            sessionId,
            totalStations,
            correctAnswers,
            incorrectAnswers,
            isPerfect: true,
          },
        },
      );

      results.push(perfectReviewResult);
    }

    return { applied: true, results };
  } catch (error) {
    if (__DEV__) {
      console.warn('Review XP could not be applied. Review completion will remain saved:', error);
    }

    return { applied: false, results };
  }
};

export const startReview = async ({
  palaceId,
  userId,
  totalStations,
}: StartReviewInput): Promise<ReviewSession> => {
  assertRequiredReviewIds({ userId, palaceId });

  const resolvedTotalStations =
    typeof totalStations === 'number'
      ? totalStations
      : await getPalaceStationCount(userId, palaceId);

  if (resolvedTotalStations < 2) {
    throw new Error('A palace needs at least 2 stations to start a review.');
  }

  const sessionRef = await addDoc(
    getReviewSessionsCollectionRef(userId, palaceId),
    {
      palaceId,
      userId,
      startedAt: serverTimestamp(),
      completedAt: null,
      totalStations: resolvedTotalStations,
      correctAnswers: 0,
      incorrectAnswers: 0,
      xpEarned: 0,
      xpAppliedToUser: false,
      isPerfect: false,
      status: 'active',
      updatedAt: serverTimestamp(),
    },
  );

  const createdSessionSnap = await getDoc(sessionRef);

  if (!createdSessionSnap.exists()) {
    throw new Error('Review session could not be created.');
  }

  return mapReviewSession(
    createdSessionSnap.id,
    createdSessionSnap.data() as ReviewSessionDocument,
  );
};

export const recordAnswer = async ({
  userId,
  palaceId,
  sessionId,
  stationId,
  correct,
}: RecordAnswerInput): Promise<ReviewAnswer> => {
  assertRequiredReviewIds({ userId, palaceId, sessionId });

  if (!stationId.trim()) {
    throw new Error('stationId is required to record an answer.');
  }

  const sessionRef = getReviewSessionRef(userId, palaceId, sessionId);
  const answerRef = getReviewAnswerRef(
    userId,
    palaceId,
    sessionId,
    stationId,
  );

  await runTransaction(db, async (transaction) => {
    const [sessionSnap, existingAnswerSnap] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(answerRef),
    ]);

    if (!sessionSnap.exists()) {
      throw new Error('Review session not found.');
    }

    const sessionData = sessionSnap.data() as ReviewSessionDocument;

    if (sessionData.status === 'completed') {
      throw new Error('Cannot record answers in a completed review session.');
    }

    let correctDelta = 0;
    let incorrectDelta = 0;

    if (!existingAnswerSnap.exists()) {
      if (correct) {
        correctDelta = 1;
      } else {
        incorrectDelta = 1;
      }
    } else {
      const previousAnswer = existingAnswerSnap.data() as ReviewAnswerDocument;

      if (previousAnswer.correct !== correct) {
        if (correct) {
          correctDelta = 1;
          incorrectDelta = -1;
        } else {
          correctDelta = -1;
          incorrectDelta = 1;
        }
      }
    }

    transaction.set(answerRef, {
      sessionId,
      stationId,
      correct,
      answeredAt: serverTimestamp(),
    });

    transaction.update(sessionRef, {
      correctAnswers: Math.max(0, sessionData.correctAnswers + correctDelta),
      incorrectAnswers: Math.max(0, sessionData.incorrectAnswers + incorrectDelta),
      updatedAt: serverTimestamp(),
    });
  });

  const updatedAnswerSnap = await getDoc(answerRef);

  if (!updatedAnswerSnap.exists()) {
    throw new Error('Answer could not be recorded.');
  }

  return mapReviewAnswer(
    updatedAnswerSnap.id,
    updatedAnswerSnap.data() as ReviewAnswerDocument,
  );
};

export const completeReview = async ({
  userId,
  palaceId,
  sessionId,
}: CompleteReviewInput): Promise<ReviewSession> => {
  assertRequiredReviewIds({ userId, palaceId, sessionId });

  const sessionRef = getReviewSessionRef(userId, palaceId, sessionId);

  let xpEarned = 0;
  let perfect = false;
  let totalStations = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let startedAt: Timestamp | null = null;
  const completedAtClientDate = new Date();

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Review session not found.');
    }

    const sessionData = sessionSnap.data() as ReviewSessionExtraFields;

    totalStations = sessionData.totalStations;
    correctAnswers = sessionData.correctAnswers;
    incorrectAnswers = sessionData.incorrectAnswers;
    startedAt =
      sessionData.startedAt instanceof Timestamp ? sessionData.startedAt : null;

    perfect = isPerfectReview({
      totalStations,
      correctAnswers,
      incorrectAnswers,
    });

    xpEarned =
      sessionData.status === 'completed'
        ? sessionData.xpEarned
        : calculateReviewXp({
            totalStations,
            correctAnswers,
            incorrectAnswers,
          });

    transaction.update(sessionRef, {
      completedAt: sessionData.completedAt ?? serverTimestamp(),
      xpEarned,
      xpAppliedToUser: sessionData.xpAppliedToUser ?? false,
      isPerfect: perfect,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  });

  const xpApplication =
    xpEarned > 0
      ? await awardReviewXPSafely({
          userId,
          palaceId,
          sessionId,
          totalStations,
          correctAnswers,
          incorrectAnswers,
          isPerfect: perfect,
        })
      : { applied: true, results: [] };

  await updateDoc(sessionRef, {
    xpAppliedToUser: xpApplication.applied,
    ...(xpApplication.applied ? { xpAppliedAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });

  await checkAchievementsSafely({
    userId,
    palaceId,
    sessionId,
    isPerfect: perfect,
    durationSeconds: getReviewDurationSeconds(
      startedAt,
      completedAtClientDate,
    ),
    correctAnswers,
    totalStations,
    xpEarned,
  });

  const updatedSessionSnap = await getDoc(sessionRef);

  if (!updatedSessionSnap.exists()) {
    throw new Error('Completed review session could not be loaded.');
  }

  return mapReviewSession(
    updatedSessionSnap.id,
    updatedSessionSnap.data() as ReviewSessionDocument,
  );
};

export const reviewService = {
  startReview,
  recordAnswer,
  completeReview,
};
