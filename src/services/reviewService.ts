// src/services/reviewService.ts

import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
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
import { db } from './firebase';
import { addXP, buildXPEventId } from './xpService';

const USERS_COLLECTION = 'users';
const PALACES_COLLECTION = 'palaces';
const REVIEW_SESSIONS_COLLECTION = 'reviewSessions';
const REVIEW_ANSWERS_SUBCOLLECTION = 'answers';

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

  const perfect = isPerfectReview({
    totalStations,
    correctAnswers,
    incorrectAnswers,
  });

  return (
    XP_REWARDS.COMPLETE_REVIEW +
    (perfect ? XP_REWARDS.PERFECT_REVIEW : 0)
  );
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

export const startReview = async ({
  palaceId,
  userId,
  totalStations,
}: StartReviewInput): Promise<ReviewSession> => {
  if (!palaceId.trim()) {
    throw new Error('palaceId is required to start a review.');
  }

  if (!userId.trim()) {
    throw new Error('userId is required to start a review.');
  }

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
      status: 'active',
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
  if (!userId.trim()) {
    throw new Error('userId is required to record an answer.');
  }

  if (!palaceId.trim()) {
    throw new Error('palaceId is required to record an answer.');
  }

  if (!sessionId.trim()) {
    throw new Error('sessionId is required to record an answer.');
  }

  if (!stationId.trim()) {
    throw new Error('stationId is required to record an answer.');
  }

  const sessionRef = getReviewSessionRef(userId, palaceId, sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Review session not found.');
  }

  const sessionData = sessionSnap.data() as ReviewSessionDocument;

  if (sessionData.status === 'completed') {
    throw new Error('Cannot record answers in a completed review session.');
  }

  const answerRef = getReviewAnswerRef(
    userId,
    palaceId,
    sessionId,
    stationId,
  );

  const existingAnswerSnap = await getDoc(answerRef);

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

  const batch = writeBatch(db);

  batch.set(answerRef, {
    sessionId,
    stationId,
    correct,
    answeredAt: serverTimestamp(),
  });

  batch.update(sessionRef, {
    correctAnswers: increment(correctDelta),
    incorrectAnswers: increment(incorrectDelta),
  });

  await batch.commit();

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
  if (!userId.trim()) {
    throw new Error('userId is required to complete a review.');
  }

  if (!palaceId.trim()) {
    throw new Error('palaceId is required to complete a review.');
  }

  if (!sessionId.trim()) {
    throw new Error('sessionId is required to complete a review.');
  }

  const sessionRef = getReviewSessionRef(userId, palaceId, sessionId);

  let xpEarned = 0;
  let perfect = false;
  let totalStations = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Review session not found.');
    }

    const sessionData = sessionSnap.data() as ReviewSessionDocument;

    totalStations = sessionData.totalStations;
    correctAnswers = sessionData.correctAnswers;
    incorrectAnswers = sessionData.incorrectAnswers;

    xpEarned =
      sessionData.status === 'completed'
        ? sessionData.xpEarned
        : calculateReviewXp({
            totalStations,
            correctAnswers,
            incorrectAnswers,
          });

    perfect = isPerfectReview({
      totalStations,
      correctAnswers,
      incorrectAnswers,
    });

    transaction.update(sessionRef, {
      completedAt: sessionData.completedAt ?? serverTimestamp(),
      xpEarned,
      xpAppliedToUser: false,
      isPerfect: perfect,
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  });

  if (xpEarned > 0) {
    await addXP(userId, xpEarned, {
      reason: perfect ? 'perfect_review' : 'complete_review',
      eventId: buildXPEventId('complete_review', sessionId),
      metadata: {
        palaceId,
        sessionId,
        totalStations,
        correctAnswers,
        incorrectAnswers,
        isPerfect: perfect,
      },
    });
  }

  await updateDoc(sessionRef, {
    xpAppliedToUser: true,
    xpAppliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
