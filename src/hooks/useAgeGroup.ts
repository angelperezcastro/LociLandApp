// src/hooks/useAgeGroup.ts

import { useCallback, useMemo } from 'react';
import type { TextStyle } from 'react-native';

import { useUserStore } from '../store/useUserStore';
import type { AgeGroup } from '../types/user';
import { normalizeAgeGroup } from '../utils/ageGroup';

const YOUNGER_FONT_SCALE = 1.15;
const OLDER_FONT_SCALE = 1;
const YOUNGER_MIN_TOUCH_TARGET = 56;
const OLDER_MIN_TOUCH_TARGET = 48;

export type AgeGroupUi = {
  ageGroup: AgeGroup;
  isYounger: boolean;
  isOlder: boolean;
  fontScale: number;
  minTouchTarget: number;
  scaleFont: (value: number) => number;
  scaleLineHeight: (value: number) => number;
  scaleTextStyle: (style: TextStyle) => TextStyle;
};

export function useAgeGroup(overrideAgeGroup?: unknown): AgeGroupUi {
  const profileAgeGroup = useUserStore((state) => state.profile?.ageGroup);

  const ageGroup = normalizeAgeGroup(overrideAgeGroup ?? profileAgeGroup);
  const isYounger = ageGroup === '6-9';
  const isOlder = ageGroup === '10-14';

  const fontScale = isYounger ? YOUNGER_FONT_SCALE : OLDER_FONT_SCALE;
  const minTouchTarget = isYounger
    ? YOUNGER_MIN_TOUCH_TARGET
    : OLDER_MIN_TOUCH_TARGET;

  const scaleFont = useCallback(
    (value: number) => Math.round(value * fontScale),
    [fontScale],
  );

  const scaleLineHeight = useCallback(
    (value: number) => Math.round(value * fontScale),
    [fontScale],
  );

  const scaleTextStyle = useCallback(
    (style: TextStyle): TextStyle => {
      if (!isYounger) {
        return style;
      }

      return {
        ...style,
        fontSize:
          typeof style.fontSize === 'number'
            ? scaleFont(style.fontSize)
            : style.fontSize,
        lineHeight:
          typeof style.lineHeight === 'number'
            ? scaleLineHeight(style.lineHeight)
            : style.lineHeight,
      };
    },
    [isYounger, scaleFont, scaleLineHeight],
  );

  return useMemo(
    () => ({
      ageGroup,
      isYounger,
      isOlder,
      fontScale,
      minTouchTarget,
      scaleFont,
      scaleLineHeight,
      scaleTextStyle,
    }),
    [
      ageGroup,
      fontScale,
      isOlder,
      isYounger,
      minTouchTarget,
      scaleFont,
      scaleLineHeight,
      scaleTextStyle,
    ],
  );
}