import { create } from 'zustand';

import type { Palace, PalaceTemplateId } from '../types';
import {
  createPalace as createPalaceService,
  deletePalace as deletePalaceService,
  getPalaces as getPalacesService,
} from '../services/palaceService';

interface PalaceStoreState {
  palaces: Palace[];
  selectedPalaceId: string | null;
  isLoading: boolean;
  error: string | null;

  loadPalaces: (userId: string) => Promise<void>;
  createPalace: (
    userId: string,
    name: string,
    templateId: PalaceTemplateId,
  ) => Promise<Palace>;
  deletePalace: (palaceId: string, userId: string) => Promise<void>;

  selectPalace: (palaceId: string | null) => void;
  getPalaceById: (palaceId: string) => Palace | undefined;

  clearPalaces: () => void;
  clearError: () => void;
}

export const usePalaceStore = create<PalaceStoreState>((set, get) => ({
  palaces: [],
  selectedPalaceId: null,
  isLoading: false,
  error: null,

  loadPalaces: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const palaces = await getPalacesService(userId);

      set({
        palaces,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load palaces.';

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  createPalace: async (
    userId: string,
    name: string,
    templateId: PalaceTemplateId,
  ) => {
    set({ isLoading: true, error: null });

    try {
      const newPalace = await createPalaceService(userId, name, templateId);

      set((state) => ({
        palaces: [newPalace, ...state.palaces],
        selectedPalaceId: newPalace.id,
        isLoading: false,
        error: null,
      }));

      return newPalace;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create palace.';

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  deletePalace: async (palaceId: string, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      await deletePalaceService(palaceId, userId);

      set((state) => ({
        palaces: state.palaces.filter((palace) => palace.id !== palaceId),
        selectedPalaceId:
          state.selectedPalaceId === palaceId ? null : state.selectedPalaceId,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete palace.';

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  selectPalace: (palaceId: string | null) => {
    set({ selectedPalaceId: palaceId });
  },

  getPalaceById: (palaceId: string) => {
    return get().palaces.find((palace) => palace.id === palaceId);
  },

  clearPalaces: () => {
    set({
      palaces: [],
      selectedPalaceId: null,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));