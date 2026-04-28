import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from './firebase';

export type ReviewScreenPalace = {
  id: string;
  name: string;
  emoji: string;
  backgroundColor: string;
  stationCount: number;
};

export type ReviewScreenStation = {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string | null;
  order: number;
};

export type ReviewScreenData = {
  palace: ReviewScreenPalace;
  stations: ReviewScreenStation[];
};

const DEFAULT_PALACE_EMOJI = '🏰';
const DEFAULT_STATION_EMOJI = '📍';
const DEFAULT_BACKGROUND_COLOR = '#DDEBFF';

const readString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
};

const readNumber = (value: unknown, fallback: number): number => {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
};

const mapPalace = (
  palaceId: string,
  data: Record<string, unknown>
): ReviewScreenPalace => {
  return {
    id: palaceId,
    name: readString(data.name ?? data.title ?? data.label, 'Memory Palace'),
    emoji: readString(data.emoji ?? data.icon, DEFAULT_PALACE_EMOJI),
    backgroundColor: readString(
      data.backgroundColor ?? data.color ?? data.colour ?? data.cardColor,
      DEFAULT_BACKGROUND_COLOR
    ),
    stationCount: readNumber(data.stationCount, 0),
  };
};

const mapStation = (
  stationId: string,
  data: Record<string, unknown>,
  fallbackOrder: number
): ReviewScreenStation => {
  return {
    id: stationId,
    name: readString(
      data.name ?? data.title ?? data.label,
      `Station ${fallbackOrder + 1}`
    ),
    emoji: readString(data.emoji ?? data.icon, DEFAULT_STATION_EMOJI),
    imageUrl:
      typeof data.imageUrl === 'string'
        ? data.imageUrl
        : typeof data.photoUrl === 'string'
          ? data.photoUrl
          : null,
    order: readNumber(data.order ?? data.position ?? data.index, fallbackOrder),
  };
};

const sortStations = (
  stations: ReviewScreenStation[]
): ReviewScreenStation[] => {
  return [...stations].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.name.localeCompare(b.name);
  });
};

const getStationsFromPalaceSubcollection = async (
  palaceId: string
): Promise<ReviewScreenStation[]> => {
  const stationsRef = collection(db, 'palaces', palaceId, 'stations');
  const snapshot = await getDocs(stationsRef);

  return snapshot.docs.map((stationDoc, index) =>
    mapStation(
      stationDoc.id,
      stationDoc.data() as Record<string, unknown>,
      index
    )
  );
};

const getStationsFromGlobalCollection = async (
  palaceId: string
): Promise<ReviewScreenStation[]> => {
  const stationsRef = collection(db, 'stations');
  const stationsQuery = query(stationsRef, where('palaceId', '==', palaceId));
  const snapshot = await getDocs(stationsQuery);

  return snapshot.docs.map((stationDoc, index) =>
    mapStation(
      stationDoc.id,
      stationDoc.data() as Record<string, unknown>,
      index
    )
  );
};

export const getReviewScreenData = async (
  palaceId: string
): Promise<ReviewScreenData> => {
  if (!palaceId.trim()) {
    throw new Error('palaceId is required to load review data.');
  }

  const palaceRef = doc(db, 'palaces', palaceId);
  const palaceSnapshot = await getDoc(palaceRef);

  if (!palaceSnapshot.exists()) {
    throw new Error('Palace not found.');
  }

  const palace = mapPalace(
    palaceSnapshot.id,
    palaceSnapshot.data() as Record<string, unknown>
  );

  let stations = await getStationsFromPalaceSubcollection(palaceId);

  if (stations.length === 0) {
    stations = await getStationsFromGlobalCollection(palaceId);
  }

  const sortedStations = sortStations(stations);

  return {
    palace: {
      ...palace,
      stationCount: Math.max(palace.stationCount, sortedStations.length),
    },
    stations: sortedStations,
  };
};