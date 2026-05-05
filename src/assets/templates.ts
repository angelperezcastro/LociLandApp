import { PALACE_TEMPLATE_IDS } from '../constants/validation';
import type { PalaceTemplate, PalaceTemplateId } from '../types';

export const palaceTemplates: PalaceTemplate[] = [
  {
    id: 'my-home',
    name: 'My Home',
    emoji: '🏠',
    description: 'A cosy place full of familiar rooms and favourite memories.',
    backgroundColour: '#FFE8A3',
  },
  {
    id: 'magic-castle',
    name: 'Magic Castle',
    emoji: '🏰',
    description: 'A grand castle with towers, secrets, and magical halls.',
    backgroundColour: '#DCC6FF',
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    emoji: '🌲',
    description: 'A peaceful forest with glowing paths and hidden clearings.',
    backgroundColour: '#BFEBC2',
  },
  {
    id: 'space-station',
    name: 'Space Station',
    emoji: '🚀',
    description: 'A futuristic station floating among stars and planets.',
    backgroundColour: '#BFD7FF',
  },
  {
    id: 'underwater-world',
    name: 'Underwater World',
    emoji: '🐠',
    description: 'A colourful ocean world with coral, fish, and bubbles.',
    backgroundColour: '#BDF4F7',
  },
  {
    id: 'dinosaur-island',
    name: 'Dinosaur Island',
    emoji: '🦕',
    description: 'A wild island with volcanoes, jungles, and friendly dinosaurs.',
    backgroundColour: '#FFD0A6',
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