import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

const PROJECT_ID = 'lociland-storage-rules-test';
const ALICE_UID = 'alice-user';
const BOB_UID = 'bob-user';
const PALACE_ID = 'palace-1';
const STATION_ID = 'station-1';

let testEnv: RulesTestEnvironment;

const toStorage = (context: RulesTestContext): FirebaseStorage =>
  context.storage() as unknown as FirebaseStorage;

const authedStorage = (uid: string): FirebaseStorage =>
  toStorage(testEnv.authenticatedContext(uid));

const stationImagePath = (uid: string, suffix: string): string =>
  `users/${uid}/palaces/${PALACE_ID}/stations/${STATION_ID}/station-image-${suffix}.png`;

const bytes = (size = 8): Uint8Array => new Uint8Array(size).fill(1);

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Storage rules — station images', () => {
  it('allows the owner to upload a valid station image', async () => {
    const storage = authedStorage(ALICE_UID);
    const fileRef = ref(storage, stationImagePath(ALICE_UID, '1001'));

    await assertSucceeds(
      uploadBytes(fileRef, bytes(), {
        contentType: 'image/png',
      }),
    );
  });

  it('denies uploads to another user path', async () => {
    const storage = authedStorage(BOB_UID);
    const fileRef = ref(storage, stationImagePath(ALICE_UID, '1002'));

    await assertFails(
      uploadBytes(fileRef, bytes(), {
        contentType: 'image/png',
      }),
    );
  });

  it('denies unsupported image content types', async () => {
    const storage = authedStorage(ALICE_UID);
    const fileRef = ref(storage, stationImagePath(ALICE_UID, '1003'));

    await assertFails(
      uploadBytes(fileRef, bytes(), {
        contentType: 'image/gif',
      }),
    );
  });

  it('denies files above the configured 2 MB limit', async () => {
    const storage = authedStorage(ALICE_UID);
    const fileRef = ref(storage, stationImagePath(ALICE_UID, '1004'));

    await assertFails(
      uploadBytes(fileRef, bytes(2 * 1024 * 1024 + 1), {
        contentType: 'image/png',
      }),
    );
  });

  it('denies invalid file names even for the owner', async () => {
    const storage = authedStorage(ALICE_UID);
    const fileRef = ref(
      storage,
      `users/${ALICE_UID}/palaces/${PALACE_ID}/stations/${STATION_ID}/avatar.png`,
    );

    await assertFails(
      uploadBytes(fileRef, bytes(), {
        contentType: 'image/png',
      }),
    );
  });
});
