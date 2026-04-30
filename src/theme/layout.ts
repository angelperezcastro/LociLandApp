// src/theme/layout.ts

import { spacing } from './spacing';

export const layout = {
  screenPadding: spacing.md,
  screenPaddingLarge: spacing.lg,
  maxContentWidth: 520,
  bottomTabPadding: 96,
  minTouchTarget: 48,
  youngerMinTouchTarget: 56,
} as const;