// src/services/storageService.ts

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type StorageReference,
} from 'firebase/storage';

import { storage } from './firebase';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const PREPARE_IMAGE_TIMEOUT_MS = 15_000;
const UPLOAD_IMAGE_TIMEOUT_MS = 30_000;
const DELETE_IMAGE_TIMEOUT_MS = 15_000;

interface UploadStationImageInput {
  userId: string;
  palaceId: string;
  stationId: string;
  uri: string;
  contentType?: string;
}

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const getImageExtensionFromContentType = (contentType?: string): string => {
  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
};

const assertUploadInput = ({
  userId,
  palaceId,
  stationId,
  uri,
}: UploadStationImageInput) => {
  if (!userId.trim()) {
    throw new Error('storageService: userId is required.');
  }

  if (!palaceId.trim()) {
    throw new Error('storageService: palaceId is required.');
  }

  if (!stationId.trim()) {
    throw new Error('storageService: stationId is required.');
  }

  if (!uri.trim()) {
    throw new Error('storageService: image uri is required.');
  }
};

const getBlobFromUri = (uri: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response as Blob);
    };

    xhr.onerror = () => {
      reject(new Error('The selected image could not be prepared for upload.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Preparing the image took too long.'));
    };

    xhr.responseType = 'blob';
    xhr.timeout = PREPARE_IMAGE_TIMEOUT_MS;
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

const closeBlobSafely = (blob: Blob) => {
  const maybeClosableBlob = blob as Blob & { close?: () => void };

  if (typeof maybeClosableBlob.close === 'function') {
    maybeClosableBlob.close();
  }
};

const getStoragePathFromDownloadUrl = (imageUri: string): string | null => {
  const trimmedUri = imageUri.trim();

  if (!trimmedUri) {
    return null;
  }

  if (trimmedUri.startsWith('gs://')) {
    const withoutScheme = trimmedUri.replace('gs://', '');
    const firstSlashIndex = withoutScheme.indexOf('/');

    if (firstSlashIndex === -1) {
      return null;
    }

    return withoutScheme.slice(firstSlashIndex + 1);
  }

  if (!trimmedUri.includes('firebasestorage.googleapis.com')) {
    return null;
  }

  const objectMarker = '/o/';
  const objectMarkerIndex = trimmedUri.indexOf(objectMarker);

  if (objectMarkerIndex === -1) {
    return null;
  }

  const encodedPathWithQuery = trimmedUri.slice(
    objectMarkerIndex + objectMarker.length,
  );

  const encodedPath = encodedPathWithQuery.split('?')[0];

  if (!encodedPath) {
    return null;
  }

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
};

const getStorageRefFromImageUri = (
  imageUri: string,
): StorageReference | null => {
  const storagePath = getStoragePathFromDownloadUrl(imageUri);

  if (!storagePath) {
    return null;
  }

  return ref(storage, storagePath);
};

const isStorageObjectNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeStorageError = error as { code?: string; message?: string };

  return (
    maybeStorageError.code === 'storage/object-not-found' ||
    maybeStorageError.message?.includes('storage/object-not-found') === true
  );
};

export const uploadStationImage = async ({
  userId,
  palaceId,
  stationId,
  uri,
  contentType = 'image/jpeg',
}: UploadStationImageInput): Promise<string> => {
  assertUploadInput({
    userId,
    palaceId,
    stationId,
    uri,
    contentType,
  });

  const extension = getImageExtensionFromContentType(contentType);

  const imagePath = [
    'users',
    userId,
    'palaces',
    palaceId,
    'stations',
    stationId,
    `station-image-${Date.now()}.${extension}`,
  ].join('/');

  const imageRef = ref(storage, imagePath);

  const imageBlob = await withTimeout(
    getBlobFromUri(uri),
    PREPARE_IMAGE_TIMEOUT_MS,
    'Preparing the image took too long. Please try another photo.',
  );

  try {
    if (imageBlob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        'This image is too large. Please choose a smaller image under 2 MB.',
      );
    }

    const uploadResult = await withTimeout(
      uploadBytes(imageRef, imageBlob, {
        contentType,
        customMetadata: {
          userId,
          palaceId,
          stationId,
        },
      }),
      UPLOAD_IMAGE_TIMEOUT_MS,
      'Image upload took too long. Please check your connection and try again.',
    );

    return await getDownloadURL(uploadResult.ref);
  } finally {
    closeBlobSafely(imageBlob);
  }
};

export const deleteStationImage = async (
  imageUri?: string | null,
): Promise<void> => {
  const trimmedImageUri = imageUri?.trim();

  if (!trimmedImageUri) {
    return;
  }

  const imageRef = getStorageRefFromImageUri(trimmedImageUri);

  if (!imageRef) {
    if (__DEV__) {
      console.warn(
        'storageService: skipped image deletion because the image URI is not a Firebase Storage URL.',
        trimmedImageUri,
      );
    }

    return;
  }

  try {
    await withTimeout(
      deleteObject(imageRef),
      DELETE_IMAGE_TIMEOUT_MS,
      'Deleting the station image took too long.',
    );
  } catch (error) {
    if (isStorageObjectNotFoundError(error)) {
      return;
    }

    throw error;
  }
};