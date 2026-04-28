import * as FileSystem from 'expo-file-system/legacy';

import { auth } from './firebase';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

interface UploadStationImageInput {
  userId: string;
  palaceId: string;
  stationId: string;
  uri: string;
  contentType?: string;
}

const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const createDownloadToken = (): string => {
  const randomPart = Math.random().toString(36).slice(2);
  const timestampPart = Date.now().toString(36);

  return `${timestampPart}-${randomPart}-${randomPart}`;
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

const getExistingFileSize = (
  fileInfo: FileSystem.FileInfo,
): number | undefined => {
  if (!fileInfo.exists) {
    return undefined;
  }

  return typeof fileInfo.size === 'number' ? fileInfo.size : undefined;
};

const assertUploadInput = async ({
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

  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new Error('The selected image file could not be found.');
  }

  const fileSize = getExistingFileSize(fileInfo);

  if (fileSize !== undefined && fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      'This image is too large. Please choose a smaller image under 2 MB.',
    );
  }
};

const getAuthenticatedUploadToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('You must be logged in to upload station images.');
  }

  return currentUser.getIdToken(true);
};

export const uploadStationImage = async ({
  userId,
  palaceId,
  stationId,
  uri,
  contentType = 'image/jpeg',
}: UploadStationImageInput): Promise<string> => {
  await assertUploadInput({
    userId,
    palaceId,
    stationId,
    uri,
    contentType,
  });

  const idToken = await getAuthenticatedUploadToken();
  const storageBucket = getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  const extension = getImageExtensionFromContentType(contentType);
  const downloadToken = createDownloadToken();

  const imagePath = [
    'users',
    userId,
    'palaces',
    palaceId,
    'stations',
    stationId,
    `station-image-${Date.now()}.${extension}`,
  ].join('/');

  const encodedImagePath = encodeURIComponent(imagePath);

  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?uploadType=media&name=${encodedImagePath}`;

  const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': contentType,
      'x-goog-meta-firebaseStorageDownloadTokens': downloadToken,
    },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(
      `Image upload failed with status ${uploadResult.status}: ${uploadResult.body}`,
    );
  }

  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedImagePath}?alt=media&token=${downloadToken}`;
};