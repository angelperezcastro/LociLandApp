import { create } from 'zustand';

import type { Palace, PalaceTemplateId, Station } from '../types';
import {
  createPalace as createPalaceService,
  deletePalace as deletePalaceService,
  getPalaces,
} from '../services/palaceService';
import {
  createStation as createStationService,
  deleteStation as deleteStationService,
  getStations,
  reorderStations as reorderStationsService,
  updateStation as updateStationService,
  type CreateStationData,
  type UpdateStationData,
} from '../services/stationService';

interface PalaceState {
  palaces: Palace[];
  stations: Record<string, Station[]>;

  /**
   * isLoading is kept for compatibility with existing screens.
   * isLoadingPalaces and isLoadingStations are more explicit for future use.
   */
  isLoading: boolean;
  isLoadingPalaces: boolean;
  isLoadingStations: boolean;

  error: string | null;

  loadPalaces: (userId: string) => Promise<void>;
  createPalace: (
    userId: string,
    name: string,
    templateId: PalaceTemplateId,
  ) => Promise<Palace>;
  deletePalace: (palaceId: string, userId: string) => Promise<void>;

  loadStations: (palaceId: string, userId: string) => Promise<void>;
  createStation: (
    palaceId: string,
    userId: string,
    data: CreateStationData,
  ) => Promise<Station>;
  updateStation: (
    stationId: string,
    palaceId: string,
    userId: string,
    data: UpdateStationData,
  ) => Promise<void>;
  deleteStation: (
    stationId: string,
    palaceId: string,
    userId: string,
  ) => Promise<void>;
  reorderStations: (
    palaceId: string,
    userId: string,
    orderedIds: string[],
  ) => Promise<void>;

  getPalaceById: (palaceId: string) => Palace | undefined;
  getStationsByPalaceId: (palaceId: string) => Station[];

  clearError: () => void;
  clearPalaceStore: () => void;
}

export const usePalaceStore = create<PalaceState>((set, get) => ({
  palaces: [],
  stations: {},

  isLoading: false,
  isLoadingPalaces: false,
  isLoadingStations: false,

  error: null,

  loadPalaces: async (userId: string) => {
    try {
      set({
        isLoading: true,
        isLoadingPalaces: true,
        error: null,
      });

      const palaces = await getPalaces(userId);

      set({
        palaces,
        isLoading: false,
        isLoadingPalaces: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load palaces.',
        isLoading: false,
        isLoadingPalaces: false,
      });

      throw error;
    }
  },

  createPalace: async (
    userId: string,
    name: string,
    templateId: PalaceTemplateId,
  ) => {
    try {
      set({ error: null });

      const createdPalace = await createPalaceService(
        userId,
        name,
        templateId,
      );

      set((state) => ({
        palaces: [createdPalace, ...state.palaces],
      }));

      return createdPalace;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create palace.',
      });

      throw error;
    }
  },

  deletePalace: async (palaceId: string, userId: string) => {
    try {
      set({ error: null });

      await deletePalaceService(palaceId, userId);

      set((state) => {
        const nextStations = { ...state.stations };
        delete nextStations[palaceId];

        return {
          palaces: state.palaces.filter((palace) => palace.id !== palaceId),
          stations: nextStations,
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to delete palace.',
      });

      throw error;
    }
  },

  loadStations: async (palaceId: string, userId: string) => {
    try {
      set({
        isLoading: true,
        isLoadingStations: true,
        error: null,
      });

      const loadedStations = await getStations(palaceId, userId);

      set((state) => ({
        stations: {
          ...state.stations,
          [palaceId]: loadedStations,
        },
        isLoading: false,
        isLoadingStations: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load stations.',
        isLoading: false,
        isLoadingStations: false,
      });

      throw error;
    }
  },

  createStation: async (
    palaceId: string,
    userId: string,
    data: CreateStationData,
  ) => {
    try {
      set({ error: null });

      const createdStation = await createStationService(
        palaceId,
        userId,
        data,
      );

      set((state) => {
        const currentStations = state.stations[palaceId] ?? [];

        return {
          stations: {
            ...state.stations,
            [palaceId]: [...currentStations, createdStation].sort(
              (a, b) => a.order - b.order,
            ),
          },
        };
      });

      return createdStation;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create station.',
      });

      throw error;
    }
  },

  updateStation: async (
    stationId: string,
    palaceId: string,
    userId: string,
    data: UpdateStationData,
  ) => {
    try {
      set({ error: null });

      await updateStationService(stationId, palaceId, userId, data);

      set((state) => {
        const currentStations = state.stations[palaceId] ?? [];

        return {
          stations: {
            ...state.stations,
            [palaceId]: currentStations
              .map((station) =>
                station.id === stationId
                  ? {
                      ...station,
                      ...data,
                      label:
                        data.label !== undefined
                          ? data.label.trim()
                          : station.label,
                      emoji:
                        data.emoji !== undefined
                          ? data.emoji.trim()
                          : station.emoji,
                      memoryText:
                        data.memoryText !== undefined
                          ? data.memoryText.trim()
                          : station.memoryText,
                    }
                  : station,
              )
              .sort((a, b) => a.order - b.order),
          },
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update station.',
      });

      throw error;
    }
  },

  deleteStation: async (
    stationId: string,
    palaceId: string,
    userId: string,
  ) => {
    try {
      set({ error: null });

      await deleteStationService(stationId, palaceId, userId);

      set((state) => {
        const currentStations = state.stations[palaceId] ?? [];

        return {
          stations: {
            ...state.stations,
            [palaceId]: currentStations.filter(
              (station) => station.id !== stationId,
            ),
          },
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to delete station.',
      });

      throw error;
    }
  },

  reorderStations: async (
    palaceId: string,
    userId: string,
    orderedIds: string[],
  ) => {
    try {
      set({ error: null });

      await reorderStationsService(palaceId, userId, orderedIds);

      set((state) => {
        const currentStations = state.stations[palaceId] ?? [];
        const orderMap = new Map(
          orderedIds.map((stationId, index) => [stationId, index]),
        );

        return {
          stations: {
            ...state.stations,
            [palaceId]: currentStations
              .map((station) => ({
                ...station,
                order: orderMap.get(station.id) ?? station.order,
              }))
              .sort((a, b) => a.order - b.order),
          },
        };
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to reorder stations.',
      });

      throw error;
    }
  },

  getPalaceById: (palaceId: string) =>
    get().palaces.find((palace) => palace.id === palaceId),

  getStationsByPalaceId: (palaceId: string) =>
    get().stations[palaceId] ?? [],

  clearError: () => {
    set({ error: null });
  },

  clearPalaceStore: () => {
    set({
      palaces: [],
      stations: {},
      isLoading: false,
      isLoadingPalaces: false,
      isLoadingStations: false,
      error: null,
    });
  },
}));