// src/theme/motion.ts

export const motion = {
  duration: {
    instant: 90,
    fast: 160,
    normal: 260,
    slow: 420,
    cinematic: 680,
    celebration: 1100,
  },

  delay: {
    none: 0,
    staggerXs: 45,
    staggerSm: 70,
    staggerMd: 110,
    reveal: 180,
  },

  scale: {
    press: 0.96,
    cardPress: 0.985,
    pop: 1.04,
  },

  spring: {
    playful: {
      damping: 12,
      stiffness: 155,
      mass: 0.9,
    },
    soft: {
      damping: 16,
      stiffness: 120,
      mass: 1,
    },
  },
} as const;

export type MotionToken = typeof motion;