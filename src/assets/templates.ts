// src/assets/templates.ts

import { PALACE_TEMPLATE_IDS } from '../constants/validation';
import { worldVisuals } from '../theme/worlds';
import type { PalaceTemplate, PalaceTemplateId } from '../types';

export const palaceTemplates: PalaceTemplate[] = [
  {
    id: 'my-home',
    name: 'My Home',
    emoji: '🏠',
    description: 'A cosy place full of familiar rooms and favourite memories.',
    backgroundColour: worldVisuals['my-home'].background,
  },
  {
    id: 'magic-castle',
    name: 'Magic Castle',
    emoji: '🏰',
    description: 'A grand castle with towers, secrets, and magical halls.',
    backgroundColour: worldVisuals['magic-castle'].background,
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    emoji: '🌲',
    description: 'A peaceful forest with glowing paths and hidden clearings.',
    backgroundColour: worldVisuals['enchanted-forest'].background,
  },
  {
    id: 'space-station',
    name: 'Space Station',
    emoji: '🚀',
    description: 'A futuristic station floating among stars and planets.',
    backgroundColour: worldVisuals['space-station'].background,
  },
  {
    id: 'underwater-world',
    name: 'Underwater World',
    emoji: '🐠',
    description: 'A colourful ocean world with coral, fish, and bubbles.',
    backgroundColour: worldVisuals['underwater-world'].background,
  },
  {
    id: 'dinosaur-island',
    name: 'Dinosaur Island',
    emoji: '🦕',
    description: 'A wild island with volcanoes, jungles, and friendly dinosaurs.',
    backgroundColour: worldVisuals['dinosaur-island'].background,
  },
];

export const getPalaceTemplateById = (
  templateId: PalaceTemplateId,
): PalaceTemplate => {
  const template = palaceTemplates.find((item) => item.id === templateId);

  if (!template) {
    throw new Error(`Unknown palace template id: ${templateId}`);
  }

  return template;
};

export const isPalaceTemplateId = (
  value: string,
): value is PalaceTemplateId => {
  return (PALACE_TEMPLATE_IDS as readonly string[]).includes(value);
};