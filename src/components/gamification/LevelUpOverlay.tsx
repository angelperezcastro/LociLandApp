// src/components/gamification/LevelUpOverlay.tsx

import React from 'react';
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

import { colors, spacing } from '../../theme';
import { useLevelUpStore } from '../../store/useLevelUpStore';

const levelUpBurstAnimation = require('../../assets/animations/level-up-burst.json');

export const LevelUpOverlay = () => {
  const { width } = useWindowDimensions();
  const currentLevelUp = useLevelUpStore((state) => state.currentLevelUp);
  const dismissLevelUp = useLevelUpStore((state) => state.dismissLevelUp);

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
    backgroundColor: 'rgba(45, 52, 54, 0.72)',
  },

  animationLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lottie: {
    width: '120%',
    height: '120%',
  },

  card: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    borderRadius: 36,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 12,
  },

  eyebrow: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.emphasis,
    marginBottom: spacing.lg,
  },

  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
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
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  badgeEmoji: {
    fontSize: 58,
    marginBottom: spacing.xs,
  },

  badgeLevel: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },

  subtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    opacity: 0.76,
  },

  levelTitle: {
    marginTop: spacing.xs,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.text,
  },

  xpText: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },

  button: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginTop: spacing.xl,
    backgroundColor: colors.softYellow,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
});