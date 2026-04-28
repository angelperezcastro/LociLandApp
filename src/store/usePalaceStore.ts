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

const EMPTY_STATIONS: Station[] = [];

interface PalaceState {
  palaces: Palace[];
  stations: Record<string, Station[]>;

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

const sortStationsByOrder = (stations: Station[]) =>
  [...stations].sort((a, b) => a.order - b.order);

const updatePalaceStationCount = (
  palaces: Palace[],
  palaceId: string,
  stationCount: number,
): Palace[] =>
  palaces.map((palace) =>
    palace.id === palaceId
      ? {
          ...palace,
          stationCount: Math.max(0, stationCount),
        }
      : palace,
  );

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

      const loadedStations = sortStationsByOrder(
        await getStations(palaceId, userId),
      );

      set((state) => ({
        palaces: updatePalaceStationCount(
          state.palaces,
          palaceId,
          loadedStations.length,
        ),
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
        const currentStations = state.stations[palaceId] ?? EMPTY_STATIONS;
        const nextStations = sortStationsByOrder([
          ...currentStations,
          createdStation,
        ]);

        return {
          palaces: updatePalaceStationCount(
            state.palaces,
            palaceId,
            nextStations.length,
          ),
          stations: {
            ...state.stations,
            [palaceId]: nextStations,
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
        const currentStations = state.stations[palaceId] ?? EMPTY_STATIONS;

        const nextStations = sortStationsByOrder(
          currentStations.map((station) => {
            if (station.id !== stationId) {
              return station;
            }

            const nextStation: Station = {
              ...station,
              ...data,
              label:
                data.label !== undefined ? data.label.trim() : station.label,
              emoji:
                data.emoji !== undefined ? data.emoji.trim() : station.emoji,
              memoryText:
                data.memoryText !== undefined
                  ? data.memoryText.trim()
                  : station.memoryText,
              imageUri:
                data.imageUri === undefined
                  ? station.imageUri
                  : data.imageUri ?? undefined,
            };

            if (data.imageUri === null) {
              delete nextStation.imageUri;
            }

            return nextStation;
          }),
        );

        return {
          stations: {
            ...state.stations,
            [palaceId]: nextStations,
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
    const previousStations = get().stations[palaceId] ?? EMPTY_STATIONS;
    const previousPalaces = get().palaces;

    try {
      set({ error: null });

      await deleteStationService(stationId, palaceId, userId);

      set((state) => {
        const currentStations = state.stations[palaceId] ?? EMPTY_STATIONS;

        const nextStations = currentStations
          .filter((station) => station.id !== stationId)
          .map((station, index) => ({
            ...station,
            order: index,
          }));

        return {
          palaces: updatePalaceStationCount(
            state.palaces,
            palaceId,
            nextStations.length,
          ),
          stations: {
            ...state.stations,
            [palaceId]: nextStations,
          },
        };
      });
    } catch (error) {
      set((state) => ({
        palaces: previousPalaces,
        stations: {
          ...state.stations,
          [palaceId]: previousStations,
        },
        error:
          error instanceof Error
            ? error.message
            : 'Unable to delete station.',
      }));

      throw error;
    }
  },

  reorderStations: async (
    palaceId: string,
    userId: string,
    orderedIds: string[],
  ) => {
    const previousStations = get().stations[palaceId] ?? EMPTY_STATIONS;

    try {
      set({ error: null });

      const orderMap = new Map(
        orderedIds.map((stationId, index) => [stationId, index]),
      );

      set((state) => {
        const currentStations = state.stations[palaceId] ?? EMPTY_STATIONS;

        const nextStations = sortStationsByOrder(
          currentStations.map((station) => ({
            ...station,
            order: orderMap.get(station.id) ?? station.order,
          })),
        );

        return {
          stations: {
            ...state.stations,
            [palaceId]: nextStations,
          },
        };
      });

      await reorderStationsService(palaceId, userId, orderedIds);
    } catch (error) {
      set((state) => ({
        stations: {
          ...state.stations,
          [palaceId]: previousStations,
        },
        error:
          error instanceof Error
            ? error.message
            : 'Unable to reorder stations.',
      }));

      throw error;
    }
  },

  getPalaceById: (palaceId: string) =>
    get().palaces.find((palace) => palace.id === palaceId),

  getStationsByPalaceId: (palaceId: string) =>
    get().stations[palaceId] ?? EMPTY_STATIONS,

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