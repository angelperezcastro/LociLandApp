import { create } from 'zustand';
import type { Palace } from '../types';

type PalaceState = {
  palaces: Palace[];
  setPalaces: (palaces: Palace[]) => void;
  addPalace: (palace: Palace) => void;
  updatePalace: (id: string, patch: Partial<Palace>) => void;
  removePalace: (id: string) => void;
  clearPalaces: () => void;
};

export const usePalaceStore = create<PalaceState>((set) => ({
  palaces: [],

  setPalaces: (palaces) => set({ palaces }),

  addPalace: (palace) =>
    set((state) => ({
      palaces: [palace, ...state.palaces],
    })),

  updatePalace: (id, patch) =>
    set((state) => ({
      palaces: state.palaces.map((palace) =>
        palace.id === id ? { ...palace, ...patch } : palace
      ),
    })),

  removePalace: (id) =>
    set((state) => ({
      palaces: state.palaces.filter((palace) => palace.id !== id),
    })),

  clearPalaces: () => set({ palaces: [] }),
}));