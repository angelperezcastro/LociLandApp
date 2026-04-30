// src/utils/errorMessages.ts

const friendlyMessages: Record<string, string> = {
  'auth/email-already-in-use': 'That email is already being used.',
  'auth/invalid-email': 'That email does not look right.',
  'auth/network-request-failed': 'The internet connection seems to be offline.',
  'permission-denied': 'You do not have permission to do that.',
  unavailable: 'The service is not available right now.',
};

type ErrorLike = {
  code?: string;
  message?: string;
};

export function getUserFriendlyError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const errorLike = error as ErrorLike;

  if (errorLike.code && friendlyMessages[errorLike.code]) {
    return friendlyMessages[errorLike.code];
  }

  if (errorLike.message) {
    const lowerMessage = errorLike.message.toLowerCase();

    if (lowerMessage.includes('network')) {
      return 'The internet connection seems to be offline.';
    }

    if (lowerMessage.includes('permission')) {
      return 'You do not have permission to do that.';
    }
  }

  return fallback;
}
