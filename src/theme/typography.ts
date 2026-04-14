import { useFonts } from 'expo-font';
import { FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

export const fontFamily = {
  heading: 'FredokaOne_400Regular',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0.15,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

export const useAppFonts = () => {
  return useFonts({
    FredokaOne_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
};