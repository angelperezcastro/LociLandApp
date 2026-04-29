// src/store/useStreakStore.ts

import { create } from 'zustand';

export interface StreakCelebrationPayload {
  currentStreak: number;
  bestStreak: number;
  isNewRecord: boolean;
  awardedSevenDayXP: boolean;
}

interface StreakStore {
  currentCelebration: StreakCelebrationPayload | null;
  showStreakCelebration: (payload: StreakCelebrationPayload) => void;
  dismissStreakCelebration: () => void;
}

export const useStreakStore = create<StreakStore>((set) => ({
  currentCelebration: null,

  showStreakCelebration: (payload) => {
    set({
      currentCelebration: payload,
    });
  },

  dismissStreakCelebration: () => {
    set({
      currentCelebration: null,
    });
  },
}));