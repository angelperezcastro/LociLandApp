import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from './firebase';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const PREPARE_IMAGE_TIMEOUT_MS = 15_000;
const UPLOAD_IMAGE_TIMEOUT_MS = 30_000;

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