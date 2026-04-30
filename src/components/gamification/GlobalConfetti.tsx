// src/components/gamification/GlobalConfetti.tsx

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '../../theme';
import { useConfettiStore } from '../../store/useConfettiStore';

const CONFETTI_DURATION_MS = 1700;
const CONFETTI_RESET_DELAY_MS = 1900;
const CONFETTI_FALL_DISTANCE_RATIO = 0.86;

type ConfettiParticleConfig = {
  id: string;
  leftPercent: number;
  delay: number;
  rotate: number;
  drift: number;
  color: string;
  size: number;
};

const CONFETTI_PARTICLES: ConfettiParticleConfig[] = [
  {
    id: 'primary-left',
    leftPercent: 8,
    delay: 0,
    rotate: 180,
    drift: -spacing.lg,
    color: colors.primary,
    size: spacing.sm,
  },
  {
    id: 'accent-left',
    leftPercent: 18,
    delay: 80,
    rotate: -220,
    drift: spacing.md,
    color: colors.accent,
    size: spacing.sm,
  },
  {
    id: 'secondary-mid-left',
    leftPercent: 31,
    delay: 150,
    rotate: 260,
    drift: -spacing.md,
    color: colors.secondary,
    size: spacing.md,
  },
  {
    id: 'emphasis-mid',
    leftPercent: 44,
    delay: 20,
    rotate: -180,
    drift: spacing.lg,
    color: colors.emphasis,
    size: spacing.sm,
  },
  {
    id: 'primary-mid-right',
    leftPercent: 57,
    delay: 110,
    rotate: 240,
    drift: -spacing.sm,
    color: colors.primary,
    size: spacing.md,
  },
  {
    id: 'accent-right',
    leftPercent: 69,
    delay: 60,
    rotate: -260,
    drift: spacing.md,
    color: colors.accent,
    size: spacing.sm,
  },
  {
    id: 'secondary-right',
    leftPercent: 81,
    delay: 190,
    rotate: 210,
    drift: -spacing.lg,
    color: colors.secondary,
    size: spacing.sm,
  },
  {
    id: 'emphasis-edge',
    leftPercent: 91,
    delay: 130,
    rotate: -200,
    drift: spacing.sm,
    color: colors.emphasis,
    size: spacing.md,
  },
];

const ConfettiParticle = ({
  particle,
  nonce,
  screenHeight,
}: {
  particle: ConfettiParticleConfig;
  nonce: number;
  screenHeight: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: CONFETTI_DURATION_MS }),
    );
  }, [nonce, particle.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - progress.value,
      transform: [
        {
          translateY:
            progress.value * screenHeight * CONFETTI_FALL_DISTANCE_RATIO,
        },
        {
          translateX: progress.value * particle.drift,
        },
        {
          rotate: `${progress.value * particle.rotate}deg`,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${particle.leftPercent}%`,
          width: particle.size,
          height: particle.size + spacing.xs,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
};

export function GlobalConfetti() {
  const { height } = useWindowDimensions();
  const isVisible = useConfettiStore((state) => state.isVisible);
  const nonce = useConfettiStore((state) => state.nonce);
  const resetConfetti = useConfettiStore((state) => state.resetConfetti);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      resetConfetti();
    }, CONFETTI_RESET_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isVisible, nonce, resetConfetti]);

  if (!isVisible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {CONFETTI_PARTICLES.map((particle) => (
        <ConfettiParticle
          key={`${particle.id}-${nonce}`}
          particle={particle}
          nonce={nonce}
          screenHeight={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
  },
  particle: {
    position: 'absolute',
    top: spacing.none,
    borderRadius: radius.xs,
  },
});
