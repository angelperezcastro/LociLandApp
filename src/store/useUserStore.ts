import { create } from 'zustand';
import type { UserProfile } from '../types';

type UserState = {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  clearUser: () => void;
};

const buildDevProfile = (): UserProfile => ({
  id: 'dev-user',
  displayName: 'Explorer',
  email: 'explorer@lociland.dev',
  avatarEmoji: '🦊',
  ageGroup: '10-14',
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: new Date().toISOString(),
});

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isAuthenticated: false,

  setAuthenticated: (value) =>
    set((state) => ({
      isAuthenticated: value,
      profile: value ? state.profile ?? buildDevProfile() : null,
    })),

  setUserProfile: (profile) =>
    set({
      profile,
      isAuthenticated: true,
    }),

  updateUserProfile: (patch) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...patch } : state.profile,
    })),

  clearUser: () =>
    set({
      profile: null,
      isAuthenticated: false,
    }),
}));