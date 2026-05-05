import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const PROJECT_ID = 'lociland-firestore-rules-test';
const ALICE_UID = 'alice-user';
const BOB_UID = 'bob-user';
const PALACE_ID = 'palace-1';
const STATION_ID = 'station-1';
const SESSION_ID = 'review-session-1';

let testEnv: RulesTestEnvironment;

const toFirestore = (context: RulesTestContext): Firestore =>
  context.firestore() as unknown as Firestore;

const authedDb = (uid: string): Firestore =>
  toFirestore(testEnv.authenticatedContext(uid));

const validUserProfile = (uid: string) => ({
  uid,
  displayName: uid === ALICE_UID ? 'Alice' : 'Bob',
  email: `${uid}@example.com`,
  avatarEmoji: '🦊',
  ageGroup: '10-14',
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: '2026-05-05',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validPalace = (uid: string) => ({
  userId: uid,
  name: 'My Test Palace',
  templateId: 'magic-castle',
  stationCount: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validStation = (uid: string, palaceId = PALACE_ID) => ({
  id: STATION_ID,
  palaceId,
  userId: uid,
  order: 0,
  emoji: '🚪',
  label: 'Door',
  memoryText: 'Remember this item.',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const validReviewSession = (
  uid: string,
  palaceId = PALACE_ID,
  totalStations = 2,
  counters = { correctAnswers: 0, incorrectAnswers: 0 },
) => ({
  palaceId,
  userId: uid,
  startedAt: serverTimestamp(),
  completedAt: null,
  totalStations,
  correctAnswers: counters.correctAnswers,
  incorrectAnswers: counters.incorrectAnswers,
  xpEarned: 0,
  xpAppliedToUser: false,
  isPerfect: false,
  status: 'active',
  updatedAt: serverTimestamp(),
});

const validStatsSummary = () => ({
  totalPalaces: 1,
  totalStations: 2,
  totalReviewSessions: 1,
  totalPerfectReviews: 1,
  totalCorrectAnswers: 2,
  totalIncorrectAnswers: 0,
  stationsWithImages: 0,
  usedTemplateIds: ['magic-castle'],
  reviewDateStrings: ['2026-05-05'],
  fastestReviewSeconds: 90,
  updatedAt: serverTimestamp(),
});

async function seedBaseUserData(uid = ALICE_UID) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = toFirestore(context);

    await setDoc(doc(db, `users/${uid}`), validUserProfile(uid));
    await setDoc(doc(db, `users/${uid}/palaces/${PALACE_ID}`), {
      ...validPalace(uid),
      stationCount: 2,
    });
    await setDoc(
      doc(db, `users/${uid}/palaces/${PALACE_ID}/stations/${STATION_ID}`),
      validStation(uid),
    );
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore rules — users', () => {
  it('allows an authenticated user to create their own valid profile', async () => {
    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      setDoc(doc(db, `users/${ALICE_UID}`), validUserProfile(ALICE_UID)),
    );
  });

  it('denies cross-user reads', async () => {
    await seedBaseUserData(BOB_UID);

    const aliceDb = authedDb(ALICE_UID);

    await assertFails(getDoc(doc(aliceDb, `users/${BOB_UID}`)));
  });

  it('denies direct XP, level or streak manipulation on the user profile', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertFails(
      updateDoc(doc(db, `users/${ALICE_UID}`), {
        xp: 5000,
        level: 10,
        streak: 365,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('allows safe editable profile fields only', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      updateDoc(doc(db, `users/${ALICE_UID}`), {
        displayName: 'Alice Updated',
        avatarEmoji: '🐼',
        ageGroup: '6-9',
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe('Firestore rules — palaces and stations', () => {
  it('allows a valid palace create and denies invalid palace data', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      setDoc(doc(db, `users/${ALICE_UID}/palaces/valid-palace`), validPalace(ALICE_UID)),
    );

    await assertFails(
      setDoc(doc(db, `users/${ALICE_UID}/palaces/invalid-palace`), {
        ...validPalace(ALICE_UID),
        name: '',
        stationCount: 999,
      }),
    );
  });

  it('allows valid station data and denies invalid station data', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      setDoc(
        doc(db, `users/${ALICE_UID}/palaces/${PALACE_ID}/stations/valid-station`),
        {
          ...validStation(ALICE_UID),
          id: 'valid-station',
          order: 1,
        },
      ),
    );

    await assertFails(
      setDoc(
        doc(db, `users/${ALICE_UID}/palaces/${PALACE_ID}/stations/invalid-station`),
        {
          ...validStation(ALICE_UID),
          id: 'invalid-station',
          label: '',
          order: 99,
        },
      ),
    );
  });
});

describe('Firestore rules — review sessions and answers', () => {
  it('allows a valid active review session create', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      setDoc(
        doc(db, `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}`),
        validReviewSession(ALICE_UID),
      ),
    );
  });

  it('allows recordAnswer counter updates and answer writes', async () => {
    await seedBaseUserData(ALICE_UID);

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          toFirestore(context),
          `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}`,
        ),
        validReviewSession(ALICE_UID),
      );
    });

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      setDoc(
        doc(
          db,
          `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}/answers/${STATION_ID}`,
        ),
        {
          sessionId: SESSION_ID,
          stationId: STATION_ID,
          correct: true,
          answeredAt: serverTimestamp(),
        },
      ),
    );

    await assertSucceeds(
      updateDoc(
        doc(db, `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}`),
        {
          correctAnswers: 1,
          incorrectAnswers: 0,
          updatedAt: serverTimestamp(),
        },
      ),
    );
  });

  it('denies malformed answer writes', async () => {
    await seedBaseUserData(ALICE_UID);

    const db = authedDb(ALICE_UID);

    await assertFails(
      setDoc(
        doc(
          db,
          `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}/answers/different-answer-id`,
        ),
        {
          sessionId: SESSION_ID,
          stationId: STATION_ID,
          correct: true,
          answeredAt: serverTimestamp(),
        },
      ),
    );
  });

  it('allows completing an active review once counters match the total station count', async () => {
    await seedBaseUserData(ALICE_UID);

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          toFirestore(context),
          `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}`,
        ),
        validReviewSession(ALICE_UID, PALACE_ID, 2, {
          correctAnswers: 2,
          incorrectAnswers: 0,
        }),
      );
    });

    const db = authedDb(ALICE_UID);

    await assertSucceeds(
      updateDoc(
        doc(db, `users/${ALICE_UID}/palaces/${PALACE_ID}/reviewSessions/${SESSION_ID}`),
        {
          completedAt: serverTimestamp(),
          xpEarned: 70,
          xpAppliedToUser: false,
          isPerfect: true,
          status: 'completed',
          updatedAt: serverTimestamp(),
        },
      ),
    );
  });
});

describe('Firestore rules — aggregated stats', () => {
  it('allows an owner to write a valid stats summary and denies cross-user reads', async () => {
    await seedBaseUserData(ALICE_UID);
    await seedBaseUserData(BOB_UID);

    const aliceDb = authedDb(ALICE_UID);
    const bobDb = authedDb(BOB_UID);

    await assertSucceeds(
      setDoc(doc(aliceDb, `users/${ALICE_UID}/stats/summary`), validStatsSummary()),
    );

    await assertFails(getDoc(doc(bobDb, `users/${ALICE_UID}/stats/summary`)));
  });
});
