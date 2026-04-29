// src/store/useAchievementToastStore.ts

import { create } from 'zustand';
import type { AchievementId } from '../assets/achievements';

export interface AchievementToastPayload {
  achievementId: AchievementId;
  title: string;
  emoji: string;
  xpReward: number;
}

interface AchievementToastStore {
  currentToast: AchievementToastPayload | null;
  queue: AchievementToastPayload[];
  showAchievementToast: (payload: AchievementToastPayload) => void;
  dismissAchievementToast: () => void;
  clearAchievementToasts: () => void;
}

export const useAchievementToastStore = create<AchievementToastStore>(
  (set, get) => ({
    currentToast: null,
    queue: [],

    showAchievementToast: (payload) => {
      const { currentToast } = get();

      if (currentToast) {
        set((state) => ({
          queue: [...state.queue, payload],
        }));
        return;
      }

      set({
        currentToast: payload,
      });
    },

    dismissAchievementToast: () => {
      const { queue } = get();
      const [nextToast, ...remainingQueue] = queue;

      set({
        currentToast: nextToast ?? null,
        queue: remainingQueue,
      });
    },

    clearAchievementToasts: () => {
      set({
        currentToast: null,
        queue: [],
      });
    },
  }),
);