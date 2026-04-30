// src/store/useConfettiStore.ts

import { create } from 'zustand';

type ConfettiStore = {
  isVisible: boolean;
  nonce: number;
  triggerConfetti: () => void;
  resetConfetti: () => void;
};

export const useConfettiStore = create<ConfettiStore>((set) => ({
  isVisible: false,
  nonce: 0,
  triggerConfetti: () => {
    set((state) => ({
      isVisible: true,
      nonce: state.nonce + 1,
    }));
  },
  resetConfetti: () => {
    set({ isVisible: false });
  },
}));
