// src/theme/typography.ts

import { useFonts } from 'expo-font';
import { FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import type { TextStyle } from 'react-native';

export const fontFamilies = {
  heading: 'FredokaOne_400Regular',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 30,
  xxl: 36,
  display: 42,
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
  },
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  h3: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  bodySemiBold: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  bodyStrong: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  small: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  button: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export function useAppFonts() {
  return useFonts({
    FredokaOne_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
}