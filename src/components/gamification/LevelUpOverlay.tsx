// src/components/gamification/LevelUpOverlay.tsx

import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  BounceIn,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';

import { colors, fontSizes, lineHeights, radius, shadows, spacing } from '../../theme';
import { useLevelUpStore } from '../../store/useLevelUpStore';
import { useConfettiStore } from '../../store/useConfettiStore';

const levelUpBurstAnimation = require('../../assets/animations/level-up-burst.json');


const LEVEL_UP_SIZES = {
  cardMaxWidth: 390,
  burstScale: '120%',
  titleSize: 46,
  titleLineHeight: 54,
  badgeEmoji: 58,
  badgeLabel: 20,
  subtitle: 17,
  levelTitle: 25,
  levelTitleLineHeight: 31,
  eyebrow: 15,
  xp: 15,
  buttonMinHeight: 56,
  buttonLabel: 20,
} as const;

export const LevelUpOverlay = () => {
  const { width } = useWindowDimensions();
  const currentLevelUp = useLevelUpStore((state) => state.currentLevelUp);
  const dismissLevelUp = useLevelUpStore((state) => state.dismissLevelUp);
  const triggerConfetti = useConfettiStore((state) => state.triggerConfetti);

  useEffect(() => {
    if (currentLevelUp) {
      triggerConfetti();
    }
  }, [currentLevelUp, triggerConfetti]);

  if (!currentLevelUp) {
    return null;
  }

  const badgeSize = Math.min(width * 0.44, 180);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissLevelUp}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={styles.backdrop}
      >
        <View style={styles.animationLayer} pointerEvents="none">
          <LottieView
            source={levelUpBurstAnimation}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <Animated.View entering={ZoomIn.duration(320)} style={styles.card}>
          <Text style={styles.eyebrow}>New rank unlocked</Text>

          <Animated.Text
            entering={BounceIn.delay(120).duration(850)}
            style={styles.title}
          >
            LEVEL UP!
          </Animated.Text>

          <View style={[styles.badge, { width: badgeSize, height: badgeSize }]}>
            <View style={styles.badgeGlow} />
            <Text style={styles.badgeEmoji}>🏆</Text>
            <Text style={styles.badgeLevel}>Level {currentLevelUp.newLevel}</Text>
          </View>

          <Text style={styles.subtitle}>
            You are now a
          </Text>

          <Text style={styles.levelTitle}>
            {currentLevelUp.levelTitle}
          </Text>

          <Text style={styles.xpText}>
            Total XP: {currentLevelUp.newXP}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss level up celebration"
            onPress={dismissLevelUp}
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.overlay,
  },

  animationLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lottie: {
    width: LEVEL_UP_SIZES.burstScale,
    height: LEVEL_UP_SIZES.burstScale,
  },

  card: {
    width: '100%',
    maxWidth: LEVEL_UP_SIZES.cardMaxWidth,
    alignItems: 'center',
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 4,
    borderColor: colors.primary,
    ...shadows.floating,
  },

  eyebrow: {
    fontSize: LEVEL_UP_SIZES.eyebrow,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: LEVEL_UP_SIZES.titleSize,
    lineHeight: LEVEL_UP_SIZES.titleLineHeight,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.emphasis,
    marginBottom: spacing.lg,
  },

  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 5,
    borderColor: colors.secondary,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  badgeGlow: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    opacity: 0.45,
  },

  badgeEmoji: {
    fontSize: LEVEL_UP_SIZES.badgeEmoji,
    marginBottom: spacing.xs,
  },

  badgeLevel: {
    fontSize: LEVEL_UP_SIZES.badgeLabel,
    fontWeight: '900',
    color: colors.text,
  },

  subtitle: {
    fontSize: LEVEL_UP_SIZES.subtitle,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.76,
  },

  levelTitle: {
    marginTop: spacing.xs,
    fontSize: LEVEL_UP_SIZES.levelTitle,
    lineHeight: LEVEL_UP_SIZES.levelTitleLineHeight,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.text,
  },

  xpText: {
    marginTop: spacing.sm,
    fontSize: LEVEL_UP_SIZES.eyebrow,
    fontWeight: '800',
    color: colors.accent,
  },

  button: {
    width: '100%',
    minHeight: LEVEL_UP_SIZES.buttonMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    backgroundColor: colors.softYellow,
    borderWidth: 3,
    borderColor: colors.primary,
    ...shadows.elevated,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },

  buttonText: {
    fontSize: LEVEL_UP_SIZES.buttonLabel,
    fontWeight: '900',
    color: colors.text,
  },
});