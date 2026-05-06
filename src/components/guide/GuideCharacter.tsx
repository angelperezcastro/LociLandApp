// src/components/guide/GuideCharacter.tsx

import React, { useEffect, useMemo, type ComponentProps } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  colors,
  fontSizes,
  radius,
  shadows,
  spacing,
  typography,
} from '../../theme';

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

type MoodMotionConfig = {
  cycleDurationMs: number;
  badgeDelayMs: number;
};

const GUIDE_SIZE_MAP: Record<Exclude<GuideCharacterSize, number>, number> = {
  sm: 88,
  md: 128,
  lg: 176,
  xl: 224,
};

const MOOD_MOTION_CONFIG: Record<GuideCharacterMood, MoodMotionConfig> = {
  idle: {
    cycleDurationMs: 1900,
    badgeDelayMs: 180,
  },
  happy: {
    cycleDurationMs: 720,
    badgeDelayMs: 80,
  },
  thinking: {
    cycleDurationMs: 1650,
    badgeDelayMs: 240,
  },
  pointing: {
    cycleDurationMs: 920,
    badgeDelayMs: 120,
  },
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

function getMoodGlowStyle(mood: GuideCharacterMood): StyleProp<ViewStyle> {
  if (mood === 'happy') {
    return styles.happyGlow;
  }

  if (mood === 'thinking') {
    return styles.thinkingGlow;
  }

  if (mood === 'pointing') {
    return styles.pointingGlow;
  }

  return styles.idleGlow;
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

  const entranceProgress = useSharedValue(0);
  const primaryMotion = useSharedValue(0);
  const secondaryMotion = useSharedValue(0);
  const badgeMotion = useSharedValue(0);
  const glowMotion = useSharedValue(0);

  useEffect(() => {
    const config = MOOD_MOTION_CONFIG[mood];

    entranceProgress.value = 0;
    primaryMotion.value = 0;
    secondaryMotion.value = 0;
    badgeMotion.value = 0;
    glowMotion.value = 0;

    entranceProgress.value = withSpring(1, {
      damping: 13,
      stiffness: 155,
      mass: 0.86,
    });

    primaryMotion.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: config.cycleDurationMs,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(0, {
          duration: config.cycleDurationMs,
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
      -1,
      false,
    );

    secondaryMotion.value = withDelay(
      Math.round(config.cycleDurationMs * 0.28),
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: Math.round(config.cycleDurationMs * 0.8),
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(0, {
            duration: Math.round(config.cycleDurationMs * 0.8),
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      ),
    );

    badgeMotion.value = withDelay(
      config.badgeDelayMs,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: Math.round(config.cycleDurationMs * 0.58),
            easing: Easing.out(Easing.back(1.6)),
          }),
          withTiming(0, {
            duration: Math.round(config.cycleDurationMs * 0.72),
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
        -1,
        false,
      ),
    );

    glowMotion.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: Math.round(config.cycleDurationMs * 1.15),
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(0, {
          duration: Math.round(config.cycleDurationMs * 1.15),
          easing: Easing.inOut(Easing.cubic),
        }),
      ),
      -1,
      false,
    );
  }, [
    badgeMotion,
    entranceProgress,
    glowMotion,
    mood,
    primaryMotion,
    secondaryMotion,
  ]);

  const characterAnimatedStyle = useAnimatedStyle(() => {
    const entranceScale = 0.9 + entranceProgress.value * 0.1;

    if (mood === 'happy') {
      return {
        opacity: entranceProgress.value,
        transform: [
          { translateY: -7 * primaryMotion.value },
          { rotate: `${-3 + 6 * secondaryMotion.value}deg` },
          { scale: entranceScale * (1 + 0.07 * primaryMotion.value) },
        ],
      };
    }

    if (mood === 'thinking') {
      return {
        opacity: entranceProgress.value,
        transform: [
          { translateY: -3 * primaryMotion.value },
          { rotate: `${-5 + 10 * primaryMotion.value}deg` },
          { scale: entranceScale * (0.99 + 0.02 * secondaryMotion.value) },
        ],
      };
    }

    if (mood === 'pointing') {
      return {
        opacity: entranceProgress.value,
        transform: [
          { translateX: 5 * primaryMotion.value },
          { translateY: -4 * secondaryMotion.value },
          { rotate: `${-1 + 3 * primaryMotion.value}deg` },
          { scale: entranceScale * (1 + 0.025 * primaryMotion.value) },
        ],
      };
    }

    return {
      opacity: entranceProgress.value,
      transform: [
        { translateY: -5 * primaryMotion.value },
        { rotate: `${-1.2 + 2.4 * secondaryMotion.value}deg` },
        { scale: entranceScale * (0.985 + 0.03 * secondaryMotion.value) },
      ],
    };
  }, [mood]);

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    if (mood === 'thinking') {
      return {
        transform: [
          { translateY: -3 * badgeMotion.value },
          { rotate: `${-7 + 14 * badgeMotion.value}deg` },
          { scale: 0.96 + 0.08 * badgeMotion.value },
        ],
      };
    }

    if (mood === 'pointing') {
      return {
        transform: [
          { translateX: 5 * badgeMotion.value },
          { scale: 0.98 + 0.12 * badgeMotion.value },
        ],
      };
    }

    return {
      transform: [
        { translateY: -4 * badgeMotion.value },
        { rotate: `${-5 + 10 * badgeMotion.value}deg` },
        { scale: 0.96 + 0.14 * badgeMotion.value },
      ],
    };
  }, [mood]);

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const moodOpacity =
      mood === 'happy'
        ? 0.46
        : mood === 'pointing'
          ? 0.32
          : mood === 'thinking'
            ? 0.26
            : 0.18;

    return {
      opacity: moodOpacity + glowMotion.value * 0.14,
      transform: [{ scale: 0.92 + glowMotion.value * 0.12 }],
    };
  }, [mood]);

  const shadowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.18 - primaryMotion.value * 0.05,
      transform: [{ scaleX: 1 + primaryMotion.value * 0.12 }],
    };
  });

  const bubbleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.38 + glowMotion.value * 0.12,
      transform: [{ scale: 0.96 + glowMotion.value * 0.04 }],
    };
  });

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
      {withBubble ? (
        <Animated.View style={[styles.softBubble, bubbleAnimatedStyle]} />
      ) : null}

      <Animated.View
        style={[
          styles.glow,
          getMoodGlowStyle(mood),
          {
            width: resolvedSize * 0.84,
            height: resolvedSize * 0.84,
            borderRadius: resolvedSize,
          },
          glowAnimatedStyle,
        ]}
      />

      <Animated.View style={[styles.characterLayer, characterAnimatedStyle]}>
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
      </Animated.View>

      <Animated.View
        style={[
          styles.groundShadow,
          {
            width: resolvedSize * 0.46,
            bottom: resolvedSize * 0.08,
          },
          shadowAnimatedStyle,
        ]}
      />

      {badge ? (
        <Animated.View
          style={[styles.badge, getMoodBadgeStyle(mood), badgeAnimatedStyle]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bubbleWrapper: {
    borderRadius: radius.xxl,
    padding: spacing.xs,
  },
  softBubble: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  glow: {
    position: 'absolute',
  },
  idleGlow: {
    backgroundColor: colors.accentSoft,
  },
  happyGlow: {
    backgroundColor: colors.primarySoft,
  },
  thinkingGlow: {
    backgroundColor: colors.surfaceSoft,
  },
  pointingGlow: {
    backgroundColor: colors.accentSoft,
  },
  characterLayer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 2,
  },
  animation: {
    alignSelf: 'center',
  },
  groundShadow: {
    position: 'absolute',
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.shadow,
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    minWidth: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 3,
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
    color: colors.text,
  },
});
