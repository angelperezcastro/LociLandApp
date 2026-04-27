import { getDownloadURL, ref, uploadString } from 'firebase/storage';

import { storage } from './firebase';

interface UploadStationImageInput {
  userId: string;
  palaceId: string;
  stationId: string;
  base64: string;
  contentType?: string;
}

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
  base64,
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

  if (!base64.trim()) {
    throw new Error('storageService: image base64 payload is required.');
  }
};

export const uploadStationImage = async (
  input: UploadStationImageInput,
): Promise<string> => {
  assertUploadInput(input);

  const contentType = input.contentType ?? 'image/jpeg';
  const extension = getImageExtensionFromContentType(contentType);

  const imagePath = [
    'users',
    input.userId,
    'palaces',
    input.palaceId,
    'stations',
    input.stationId,
    `station-image-${Date.now()}.${extension}`,
  ].join('/');

  const imageRef = ref(storage, imagePath);

  const uploadResult = await uploadString(imageRef, input.base64, 'base64', {
    contentType,
    customMetadata: {
      userId: input.userId,
      palaceId: input.palaceId,
      stationId: input.stationId,
    },
  });

  return getDownloadURL(uploadResult.ref);
};