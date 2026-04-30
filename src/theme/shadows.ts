// src/theme/shadows.ts

import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

function createShadow(
  elevation: number,
  opacity: number,
  shadowRadius: number,
  offsetY: number,
): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: offsetY,
        },
        shadowOpacity: opacity,
        shadowRadius,
      },
      android: {
        elevation,
      },
      default: {
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: offsetY,
        },
        shadowOpacity: opacity,
        shadowRadius,
      },
    }) ?? {}
  );
}

export const shadows = {
  none: {},
  soft: createShadow(2, 0.1, 8, 3),
  card: createShadow(4, 0.14, 12, 5),
  elevated: createShadow(7, 0.18, 18, 8),
  floating: createShadow(10, 0.22, 24, 10),
} as const;