// src/assets/achievements.ts

export type AchievementId =
  | 'first_steps'
  | 'builder'
  | 'architect'
  | 'dedicated_learner'
  | 'perfect_mind'
  | 'on_fire'
  | 'unstoppable'
  | 'explorer'
  | 'photographer'
  | 'memory_knight'
  | 'memory_master'
  | 'speed_demon';

export type AchievementCondition =
  | {
      type: 'palaces_created';
      target: number;
    }
  | {
      type: 'stations_added';
      target: number;
    }
  | {
      type: 'reviews_completed';
      target: number;
    }
  | {
      type: 'perfect_reviews';
      target: number;
    }
  | {
      type: 'streak_reached';
      target: number;
    }
  | {
      type: 'templates_used';
      target: number;
    }
  | {
      type: 'stations_with_images';
      target: number;
    }
  | {
      type: 'level_reached';
      target: number;
    }
  | {
      type: 'review_under_seconds';
      target: number;
      ageGroup: '10-14';
    };

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  lockedDescription: string;
  emoji: string;
  xpReward: number;
  condition: AchievementCondition;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Create your first memory palace.',
    lockedDescription: 'Start your journey by creating a palace.',
    emoji: '🌟',
    xpReward: 25,
    condition: {
      type: 'palaces_created',
      target: 1,
    },
  },
  {
    id: 'builder',
    title: 'Builder',
    description: 'Add 10 stations across your palaces.',
    lockedDescription: 'Keep building memory stations.',
    emoji: '🧱',
    xpReward: 50,
    condition: {
      type: 'stations_added',
      target: 10,
    },
  },
  {
    id: 'architect',
    title: 'Architect',
    description: 'Create 5 different memory palaces.',
    lockedDescription: 'Create more palaces to unlock this.',
    emoji: '🏛️',
    xpReward: 75,
    condition: {
      type: 'palaces_created',
      target: 5,
    },
  },
  {
    id: 'dedicated_learner',
    title: 'Dedicated Learner',
    description: 'Complete 10 review sessions.',
    lockedDescription: 'Review your palaces regularly.',
    emoji: '📚',
    xpReward: 100,
    condition: {
      type: 'reviews_completed',
      target: 10,
    },
  },
  {
    id: 'perfect_mind',
    title: 'Perfect Mind',
    description: 'Get a perfect score in a review.',
    lockedDescription: 'Complete a perfect review.',
    emoji: '💎',
    xpReward: 75,
    condition: {
      type: 'perfect_reviews',
      target: 1,
    },
  },
  {
    id: 'on_fire',
    title: 'On Fire',
    description: 'Reach a 7-day streak.',
    lockedDescription: 'Visit your palaces for 7 days in a row.',
    emoji: '🔥',
    xpReward: 100,
    condition: {
      type: 'streak_reached',
      target: 7,
    },
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak.',
    lockedDescription: 'Build a serious memory habit.',
    emoji: '⚡',
    xpReward: 250,
    condition: {
      type: 'streak_reached',
      target: 30,
    },
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Use all 6 palace templates.',
    lockedDescription: 'Try every palace template.',
    emoji: '🗺️',
    xpReward: 125,
    condition: {
      type: 'templates_used',
      target: 6,
    },
  },
  {
    id: 'photographer',
    title: 'Photographer',
    description: 'Add images to 5 stations.',
    lockedDescription: 'Add photos to your stations.',
    emoji: '📸',
    xpReward: 75,
    condition: {
      type: 'stations_with_images',
      target: 5,
    },
  },
  {
    id: 'memory_knight',
    title: 'Memory Knight',
    description: 'Reach Level 5.',
    lockedDescription: 'Keep earning XP to reach Level 5.',
    emoji: '⚔️',
    xpReward: 150,
    condition: {
      type: 'level_reached',
      target: 5,
    },
  },
  {
    id: 'memory_master',
    title: 'Memory Master',
    description: 'Reach Level 10.',
    lockedDescription: 'Reach the highest memory rank.',
    emoji: '👑',
    xpReward: 300,
    condition: {
      type: 'level_reached',
      target: 10,
    },
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a review in under 2 minutes.',
    lockedDescription: 'Older explorers can unlock this with a fast review.',
    emoji: '⏱️',
    xpReward: 100,
    condition: {
      type: 'review_under_seconds',
      target: 120,
      ageGroup: '10-14',
    },
  },
];

export const ACHIEVEMENT_BY_ID = ACHIEVEMENTS.reduce<
  Record<AchievementId, AchievementDefinition>
>((accumulator, achievement) => {
  accumulator[achievement.id] = achievement;
  return accumulator;
}, {} as Record<AchievementId, AchievementDefinition>);