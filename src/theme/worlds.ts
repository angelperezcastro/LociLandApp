// src/theme/worlds.ts

import type { PalaceTemplateId } from '../types';

export type WorldVisuals = {
  id: PalaceTemplateId;
  background: string;
  surface: string;
  surfaceStrong: string;
  path: string;
  pathSoft: string;
  node: string;
  nodeSoft: string;
  accent: string;
  accentSoft: string;
  textOnAccent: string;
  landmarkEmoji: string;
  atmosphereEmoji: string;
};

export const worldVisuals: Record<PalaceTemplateId, WorldVisuals> = {
  'my-home': {
    id: 'my-home',
    background: '#FFE8A3',
    surface: '#FFF7D1',
    surfaceStrong: '#FFD96A',
    path: '#C97922',
    pathSoft: '#F7C982',
    node: '#FFB347',
    nodeSoft: '#FFE7BC',
    accent: '#E9783F',
    accentSoft: '#FFE1D0',
    textOnAccent: '#2D3436',
    landmarkEmoji: '🏡',
    atmosphereEmoji: '☀️',
  },

  'magic-castle': {
    id: 'magic-castle',
    background: '#DCC6FF',
    surface: '#F1E8FF',
    surfaceStrong: '#B99CFF',
    path: '#7F5AD8',
    pathSoft: '#D4C2FF',
    node: '#9E7BFF',
    nodeSoft: '#ECE3FF',
    accent: '#6D4FD3',
    accentSoft: '#E5DAFF',
    textOnAccent: '#FFFFFF',
    landmarkEmoji: '🏰',
    atmosphereEmoji: '✨',
  },

  'enchanted-forest': {
    id: 'enchanted-forest',
    background: '#BFEBC2',
    surface: '#E4F8E6',
    surfaceStrong: '#8DD998',
    path: '#3E8F55',
    pathSoft: '#B8E7BF',
    node: '#54B96D',
    nodeSoft: '#DDF8E1',
    accent: '#2F7A48',
    accentSoft: '#CBEFD3',
    textOnAccent: '#FFFFFF',
    landmarkEmoji: '🌲',
    atmosphereEmoji: '🍃',
  },

  'space-station': {
    id: 'space-station',
    background: '#BFD7FF',
    surface: '#E8F0FF',
    surfaceStrong: '#8FB7FF',
    path: '#315BA8',
    pathSoft: '#BCD2FF',
    node: '#4D96FF',
    nodeSoft: '#DDEBFF',
    accent: '#284E9A',
    accentSoft: '#D8E6FF',
    textOnAccent: '#FFFFFF',
    landmarkEmoji: '🚀',
    atmosphereEmoji: '⭐',
  },

  'underwater-world': {
    id: 'underwater-world',
    background: '#BDF4F7',
    surface: '#E2FBFC',
    surfaceStrong: '#7DE4EA',
    path: '#1B93A1',
    pathSoft: '#B8EEF2',
    node: '#38C4CE',
    nodeSoft: '#D8F9FB',
    accent: '#087C8A',
    accentSoft: '#C8F3F6',
    textOnAccent: '#FFFFFF',
    landmarkEmoji: '🐠',
    atmosphereEmoji: '🫧',
  },

  'dinosaur-island': {
    id: 'dinosaur-island',
    background: '#FFD0A6',
    surface: '#FFEBD9',
    surfaceStrong: '#FFB26B',
    path: '#B96020',
    pathSoft: '#F8C391',
    node: '#F58B42',
    nodeSoft: '#FFE0C8',
    accent: '#A34F18',
    accentSoft: '#FFD9BC',
    textOnAccent: '#FFFFFF',
    landmarkEmoji: '🦕',
    atmosphereEmoji: '🌋',
  },
};

export const getWorldVisuals = (templateId: PalaceTemplateId): WorldVisuals => {
  return worldVisuals[templateId];
};