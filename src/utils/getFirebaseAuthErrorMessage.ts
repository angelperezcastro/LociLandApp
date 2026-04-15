type FirebaseAuthErrorLike = {
  code?: string;
};

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as FirebaseAuthErrorLike).code === 'string'
      ? (error as FirebaseAuthErrorLike).code
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already in use. Try another one or log in instead.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/weak-password':
      return 'Your password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'It looks like you are offline. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'We could not create your account. Please try again.';
  }
}