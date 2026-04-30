// src/components/guide/GuideCharacter.tsx

import React, { useMemo, type ComponentProps } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { colors, fontSizes, radius, shadows, spacing, typography } from '../../theme';

export type GuideCharacterMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'pointing';

type GuideCharacterSize = 'sm' | 'md' | 'lg' | 'xl' | number;

type LottieSource = ComponentProps<typeof LottieView>['source'];

type GuideCharacterProps = {
  mood?: GuideCharacterMood;
  size?: GuideCharacterSize;
  loop?: boolean;
  autoPlay?: boolean;
  withBubble?: boolean;
  style?: StyleProp<ViewStyle>;
  animationStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

const GUIDE_SIZE_MAP: Record<Exclude<GuideCharacterSize, number>, number> = {
  sm: 88,
  md: 128,
  lg: 176,
  xl: 224,
};

const guideBaseAnimation = require('../../assets/animations/guide/guide-base.json') as LottieSource;

function resolveGuideSize(size: GuideCharacterSize): number {
  return typeof size === 'number' ? size : GUIDE_SIZE_MAP[size];
}

function getMoodBadge(mood: GuideCharacterMood): string | null {
  if (mood === 'happy') {
    return '✨';
  }

  if (mood === 'thinking') {
    return '?';
  }

  if (mood === 'pointing') {
    return '➜';
  }

  return null;
}

function getMoodBadgeStyle(mood: GuideCharacterMood): StyleProp<ViewStyle> {
  if (mood === 'happy') {
    return styles.happyBadge;
  }

  if (mood === 'thinking') {
    return styles.thinkingBadge;
  }

  if (mood === 'pointing') {
    return styles.pointingBadge;
  }

  return null;
}

export function GuideCharacter({
  mood = 'idle',
  size = 'md',
  loop = true,
  autoPlay = true,
  withBubble = false,
  style,
  animationStyle,
  testID,
}: GuideCharacterProps) {
  const resolvedSize = resolveGuideSize(size);
  const badge = useMemo(() => getMoodBadge(mood), [mood]);

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.wrapper,
        withBubble && styles.bubbleWrapper,
        {
          width: resolvedSize,
          height: resolvedSize,
        },
        style,
      ]}
    >
      {withBubble ? <View style={styles.softBubble} /> : null}

      <LottieView
        source={guideBaseAnimation}
        autoPlay={autoPlay}
        loop={loop}
        resizeMode="contain"
        style={[
          styles.animation,
          {
            width: resolvedSize,
            height: resolvedSize,
          },
          animationStyle,
        ]}
      />

      {badge ? (
        <View style={[styles.badge, getMoodBadgeStyle(mood)]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrapper: {
    borderRadius: radius.xxl,
    padding: spacing.xs,
  },
  softBubble: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    opacity: 0.42,
    ...shadows.soft,
  },
  animation: {
    alignSelf: 'center',
  },
  badge: {
    position: 'absolute',
    minWidth: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.soft,
  },
  happyBadge: {
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary,
  },
  thinkingBadge: {
    top: spacing.sm,
    right: spacing.xs,
    backgroundColor: colors.surface,
  },
  pointingBadge: {
    right: spacing.xs,
    top: '42%',
    backgroundColor: colors.accent,
  },
  badgeText: {
    ...typography.bodyStrong,
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: colors.text,
  },
});