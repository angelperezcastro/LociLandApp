// src/store/useLevelUpStore.ts

import { create } from 'zustand';

export interface LevelUpPayload {
  previousLevel: number;
  newLevel: number;
  newXP: number;
  levelTitle: string;
}

interface LevelUpStore {
  currentLevelUp: LevelUpPayload | null;
  queue: LevelUpPayload[];
  showLevelUp: (payload: LevelUpPayload) => void;
  dismissLevelUp: () => void;
  clearLevelUps: () => void;
}

export const useLevelUpStore = create<LevelUpStore>((set, get) => ({
  currentLevelUp: null,
  queue: [],

  showLevelUp: (payload) => {
    const { currentLevelUp } = get();

    if (currentLevelUp) {
      set((state) => ({
        queue: [...state.queue, payload],
      }));
      return;
    }

    set({
      currentLevelUp: payload,
    });
  },

  dismissLevelUp: () => {
    const { queue } = get();
    const [nextLevelUp, ...remainingQueue] = queue;

    set({
      currentLevelUp: nextLevelUp ?? null,
      queue: remainingQueue,
    });
  },

  clearLevelUps: () => {
    set({
      currentLevelUp: null,
      queue: [],
    });
  },
}));