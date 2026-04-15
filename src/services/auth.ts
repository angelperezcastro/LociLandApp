import {
  GoogleAuthProvider,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from './firebase';

export const signUp = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthStateChanged = (
  callback: (user: User | null) => void
) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const signInWithGoogleIdToken = async (
  idToken: string,
  accessToken?: string
): Promise<UserCredential> => {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  return signInWithCredential(auth, credential);
};

export const setCurrentUserDisplayName = async (
  displayName: string
): Promise<void> => {
  if (!auth.currentUser) {
    return;
  }

  await updateProfile(auth.currentUser, {
    displayName,
  });
};