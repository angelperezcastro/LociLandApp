import { create } from 'zustand';
import type { User } from 'firebase/auth';

import type { UserProfile } from '../types/user';
import { ensureUserProfile, getUserProfile } from '../services/userProfile';

export type UserStore = {
  authUser: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isLoadingProfile: boolean;
  setAuthenticated: (value: boolean) => void;
  setAuthResolved: (value: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  hydrateFromAuthUser: (user: User) => Promise<void>;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  authUser: null,
  profile: null,
  isAuthenticated: false,
  isAuthResolved: false,
  isLoadingProfile: false,

  setAuthenticated: (value) => {
    set({ isAuthenticated: value });
  },

  setAuthResolved: (value) => {
    set({ isAuthResolved: value });
  },

  setUserProfile: (profile) => {
    set({ profile });
  },

  hydrateFromAuthUser: async (user) => {
    set({
      authUser: user,
      isAuthenticated: true,
      isLoadingProfile: true,
    });

    const existingProfile = await getUserProfile(user.uid);

    if (existingProfile) {
      set({
        profile: existingProfile,
        isLoadingProfile: false,
      });
      return;
    }

    const ensuredProfile = await ensureUserProfile({
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? 'Explorer',
    });

    set({
      profile: ensuredProfile,
      isLoadingProfile: false,
    });
  },

  clearUser: () => {
    set({
      authUser: null,
      profile: null,
      isAuthenticated: false,
      isLoadingProfile: false,
    });
  },
}));

export const selectAuthUser = (state: UserStore): User | null => state.authUser;

export const selectAuthUserId = (state: UserStore): string | null =>
  state.authUser?.uid ?? null;

export const selectUserProfile = (state: UserStore): UserProfile | null =>
  state.profile;
